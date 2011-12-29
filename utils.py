from csv import DictReader
import random

from flask import jsonify


ALLOWED_EXTENSIONS = set(['txt', 'csv'])

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

def jsonify_csv(csv_file):
    players = {i: row for i, row in enumerate(DictReader(csv_file))}
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
    """
    This splits the players into several lists of the size num_teams, this means that when
    creating the teams we can pick 1 player from each list for each team
    TODO: test this with a number of teams not exactly divisible by num_teams
    """
    return [players[i*num_teams: (i+1)*num_teams]
            for i in xrange(len(players) // num_teams)]

def teamify(players, num_teams, total_points):
    """
    Here we create the actual teams. The theory behind this algorithm is that we get the
    total number of player points available and split the points evenly between each team.
    We then go over each list of players and randomly assign each player to a team (one per team).
    The random function takes into account the number of points left available to the current team
    and weights the random accordingly. If the team has a low number of points left then they get
    a player that is toward the end of the list (we have ordered the players so that index 0 is the
    best player and index -1 the worst)
    """
    teams = []
    points_per_team = total_points // num_teams

    #create the correct number of teams. Must be a better way to do this?
    for i in xrange(num_teams):
        teams.append({'players': [], 'points': points_per_team})

    for list_players in players:
        if len(list_players) > 0:
            for team in teams:
                index = weighted_rand(teams.index(team) + 1, len(list_players)) - 1
                team['players'].append(list_players[index])
                team['points'] -= list_players[index]['points']
                list_players.pop(index)
            #if len(list_players) > 0:
            #    for i in xrange(len(list_players)):
            #        index = random.randint(0, len(teams)-1)
            #        teams[index]['players'].append(list_players[0])
            #        #team['points'] -= list_players[0]['points']
            #        list_players.pop(0)
            teams = qsort(teams)
    return teams

def weighted_rand(weight, size):
    random.seed()
    rand = random.random() #0-1, never actually generates 1
    return size - int(size * pow(rand, weight))

