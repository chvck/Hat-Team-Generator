import csv
import random

from flask import Flask, jsonify, redirect, request, url_for


ALLOWED_EXTENSIONS = set(['txt', 'csv'])

app = Flask(__name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET'])
def main():
    return redirect(url_for('static', filename='index.html'))

@app.route('/upload', methods=['POST'])
def upload():
    players = {}
    #data = request.files['inputCSV']
    #if data and allowed_file(data.filename):
    #reader = csv.DictReader(data, delimiter=',')
    reader = csv.DictReader(open('../hatstuff.txt', 'r'), delimiter=',')
    ###############
    #i = 0
    #for row in reader:
    #    players[i] = row
    #    i += 1
    players = dict((i, row) for (i, row) in enumerate(reader))
    players['length'] = len(players)
    return jsonify(players)

def qsort(slist):
    if not slist:
        return []
    pivot = slist[0]
    lesser = qsort([x for x in slist[1:] if x['points'] > pivot['points']])
    greater = qsort([x for x in slist[1:] if x['points'] <= pivot['points']])
    return lesser + [pivot] + greater

def split_players(players, num_teams):
    return [players[i*num_teams: (i+1)*num_teams]
            for i in xrange(len(players) // num_teams)]

def teamify(players, num_teams, total_points):
    teams = {}
    random.seed()
    points_per_team = total_points // num_teams
    for i in xrange(num_teams):
        #team['points'] = points_per_team
        teams[i] = {'players': ''}
    for list_players in players:
        print len(list_players)
        if len(list_players) > 0:
            for teamKey in teams:
                index = random.randint(0, len(list_players)-1)
                teams[teamKey]['players'].append(list_players[index])
                #team['points'] -= list_players[index]['points']
                list_players.pop(index)
            #if len(list_players) > 0:
            #    for i in xrange(len(list_players)):
            #        index = random.randint(0, len(teams)-1)
            #        teams[index]['players'].append(list_players[0])
            #        #team['points'] -= list_players[0]['points']
            #        list_players.pop(0)
    return teams

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    players = data['players']
    number_teams = int(data['numTeams'])
    players_per_team = len(players) / number_teams
    ranked_players = []
    formula = {}
    columns = data['columns']
    for column in columns:
        if int(columns[column]) != 0:
            formula[column.strip()] = int(columns[column])
    total_points = 0
    for player in players:
        player_points = 0
        for attribute in player:
            if formula.has_key(attribute.strip()):
                player_points += (int(player[attribute]) * formula[attribute.strip()])
        player['points'] = player_points
        total_points += player_points
    ranked_players = qsort(players)
    ranked_players = split_players(ranked_players, number_teams)

    teams = teamify(ranked_players, number_teams, total_points)

    for team in teams:
        points = 0
        for player in teams[team]['players']:
            #print player
            points += player['points']
        #print ''
    #print (teams)
    teams['length'] = len(teams)
    return jsonify(teams)

if __name__ == '__main__':
    app.run(debug = True)
