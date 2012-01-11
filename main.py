from os.path import abspath, dirname, join
from time import strftime
from random import choice

from flask import Flask, request, send_from_directory, render_template, jsonify, session

from utils import allowed_file, jsonify_csv, qsort, split_players, teamify

from werkzeug import secure_filename
from werkzeug.wsgi import SharedDataMiddleware

app = Flask(__name__)
app.secret_key = '<insertsomethingsecret>'

if app.config['DEBUG']:
    app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
        '/': join(dirname(__file__), 'static')
    })

@app.route('/', methods=['GET'])
def main():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    data = request.files['inputCSV']
    session['uploaded_filename'] = secure_filename(data.filename)
    if data and allowed_file(data.filename):
        return jsonify_csv(data)

@app.route('/test', methods=['POST'])
def test_csv():
    session['uploaded_filename'] = secure_filename('testing')
    return jsonify_csv(open(join(abspath(dirname(__file__)), 'test/test_hat_genders.txt'), 'r'))

@app.route('/generate', methods=['POST'])
def generate():
    players = request.json['players']
    if len(players) < 2:
        return jsonify({'status': 'failed', 'message': 'You might want a few more players, must have 2 or more.'})
    
    number_teams = 0
    try:    
        number_teams = int(request.json['numTeams'])
    except ValueError:
        return jsonify({'status': 'failed', 'message': 'Helps if the number of teams is numeric.'})
    if number_teams < 2:
        return jsonify({'status': 'failed', 'message': 'Too few teams, must have 2 or more.'})
        
    players_per_team = len(players) // number_teams
    if players_per_team < 1:
        return jsonify({'status': 'failed', 'message': 'Too few teams, must have 1 player per team or more.'})
        
    formula = {}
    attributes = request.json['columns']
    try:
        for attribute in attributes:
            value = attributes[attribute]
            if float(value) != 0.0:
                formula[attribute] = float(value)
    except ValueError:
        return jsonify({'status': 'failed', 'message': 'You entered a non-numeric metric value didn\'t you?'})

        
    try:
        gender_column = request.json['genderColumn']
    except KeyError:
        gender_column = None
        
    if gender_column is not None:
        gender_format = request.json['genderFormat']
        if gender_format == 'M':
            gender_format = ['M', 'F', 'U']
        else:
            gender_format = ['Male', 'Female', 'Unknown']
        genders = {}
        for gender in gender_format:
            genders[gender] = []    

    total_points = 0.0
    for player in players:
        player_points = 0.0
        for attribute in player:
            if attribute in formula:
                try:
                    player_points += (float(player[attribute]) * formula[attribute])
                except ValueError:
                    #don't really care if this happens, we just need to prevent it breaking the app
                    pass   
        player['points'] = player_points
        total_points += player_points
        if gender_column is not None:
            try:
                genders[player[gender_column]].append(player)
            except KeyError:
                #incorrect value in the gender column so add to unknown
                genders[gender_format[2]].append(player)
                
    ranked_players = []
    if gender_column is not None:
        for gender in genders:
            for split in split_players(qsort(genders[gender]), number_teams):
                ranked_players.append(split)
    else:
        ranked_players = split_players(qsort(players), number_teams)

    teams = teamify(ranked_players, number_teams, total_points)

    #num_players = 0
    #for team in teams:
    #    points = 0
    #    for player in team['players']:
    #        print player
    #        points += player['points']
    #    print points
    #    print team['points']
    #    num_players += len(team['players'])
    #    print ''
    #print num_players

    filename = session['uploaded_filename'] + '-' + '%s.csv' % strftime('%Y-%m-%d %H-%M-%S')
    with open('downloads/' + filename, 'w') as team_file:
        line = 'Team,'
        for column in attributes:
            line = line + column + ','
        line = line + 'Points' + '\n'
        team_file.write(line)
        for team in teams:
            points = 0
            for player in team['players']:
                line = str(teams.index(team)) + ','
                for column in attributes:
                    line = line + str(player[column]) + ','
                line = line + str(player['points']) + '\n'
                team_file.write(line)
                points += player['points']
            team_file.write('Total team points: %s, Average player player points: %s\n' % (
                            str(points), str(points/len(team['players']))))

    session['filename'] = filename
    return jsonify({'status': 'success'})
    
@app.route('/download', methods=['POST'])
def download():
    """
    We can't send the download to the js callback after creating the teams so do it here
    """
    return send_from_directory('downloads', session['filename'], as_attachment=True, mimetype='text/csv')

if __name__ == '__main__':
    app.run(debug=True)

