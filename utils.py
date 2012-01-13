from csv import DictReader
import random

from flask import jsonify


ALLOWED_EXTENSIONS = set(['txt', 'csv'])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

def jsonify_csv(csv_file):
    players = {i: row for i, row in enumerate(DictReader(csv_file))}
    players['length'] = len(players)
    players['status'] = 'success'
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
    """
    split = [players[i*num_teams: (i+1)*num_teams]
            for i in xrange(len(players) // num_teams)]
    #need to do this in order to pick up any remaining players that didn't fit into a complete list
    split.append(players[0-(len(players) % num_teams): len(players)])
    return split

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

    for list_of_players in players:
        for team in teams:
            list_length = len(list_of_players)
            if len(list_of_players) == 0:
                break
            #this won't cause the assigment of players to change much from the list order
            #but does add a bit of variation
            index = weighted_rand(teams.index(team), list_length - 1)
            current_player = list_of_players[index]
            team['players'].append(current_player)
            team['points'] -= current_player['points']
            list_of_players.pop(index)
        teams = qsort(teams)
    return teams

def weighted_rand(weight, size):
    random.seed()
    return size - int(size * pow(random.random(), weight))

#load of useful code i dont want to get rid of just yet
    #balanced_attributes = request.json('balanceAttributes')
    #
    #total_points = 0.0
    #ranked_players = {}
    #if gender_column is not None and len(balanced_attributes > 0):
    #    for gender in gender_format:
    #        this_gender = {}
    #        for attribute in balanced_attributes:
    #            this_gender[attribute] = []
    #        ranked_players[gender] = this_gender
    #        
    #    for player in players:
    #        player_points = 0.0
    #        highest_attribute_value = None
    #        highest_attribute_index = []
    #                            
    #        gender = ''
    #        try:
    #            gender = gender_format[gender_format.index(player[gender_column])]
    #        except ValueError:
    #            gender = gender_format[2]
    #        for attribute in player:
    #            stripped_attribute = attribute.strip()
    #            if stripped_attribute in formula:
    #                try:
    #                    player_points += (float(player[attribute]) * formula[stripped_attribute])
    #                except ValueError:
    #                    player_points += 0
    #
    #            if attribute in ranked_players[gender]:
    #                if player[attribute] > highest_attribute_value:
    #                    highest_attribute_index = [attribute]
    #                    highest_attribute_value = player[attribute]
    #                elif player[attribute] == highest_attribute_value:
    #                    highest_attribute_index.append(player[attribute])
    #        attribute_list = random.choice(highest_attribute_index)
    #        ranked_players[gender][attribute_list].append(player)
    #        
    #        player['points'] = player_points
    #        total_points += player_points
    #elif gender_column is not None and len(balanced_attributes == 0):
    #    for gender in gender_format:
    #        ranked_players[gender] = []
    #
    #    for player in players:
    #        player_points = 0.0
    #        highest_attribute_value = None
    #        highest_attribute_index = []
    #                            
    #        gender = ''
    #        try:
    #            gender = gender_format[gender_format.index(player[gender_column])]
    #        except ValueError:
    #            gender = gender_format[2]
    #        for attribute in player:
    #            stripped_attribute = attribute.strip()
    #            if stripped_attribute in formula:
    #                try:
    #                    player_points += (float(player[attribute]) * formula[stripped_attribute])
    #                except ValueError:
    #                    player_points += 0
    #
    #        ranked_players[gender].append(player)            
    #        player['points'] = player_points
    #        total_points += player_points
    #elif gender_column is None and len(balanced_attributes > 0):
    #    for attribute in balanced_attributes:
    #        ranked_players[attribute] = []
    #        
    #    for player in players:
    #        player_points = 0.0
    #        highest_attribute_value = None
    #        highest_attribute_index = []
    #                            
    #        for attribute in player:
    #            stripped_attribute = attribute.strip()
    #            if stripped_attribute in formula:
    #                try:
    #                    player_points += (float(player[attribute]) * formula[stripped_attribute])
    #                except ValueError:
    #                    player_points += 0
    #
    #            if attribute in ranked_players[gender]:
    #                if player[attribute] > highest_attribute_value:
    #                    highest_attribute_index = [attribute]
    #                    highest_attribute_value = player[attribute]
    #                elif player[attribute] == highest_attribute_value:
    #                    highest_attribute_index.append(player[attribute])
    #        attribute_list = random.choice(highest_attribute_index)
    #        ranked_players[attribute_list].append(player)
    #        
    #        player['points'] = player_points
    #        total_points += player_points
    #else:
    #    ranked_players = []
    #    
    #    total_points = 0.0
    #    for player in players:
    #        player_points = 0.0
    #        for attribute in player:
    #            stripped_attribute = attribute.strip()
    #            if stripped_attribute in formula:
    #                try:
    #                    player_points += (float(player[attribute]) * formula[stripped_attribute])
    #                except ValueError:
    #                    player_points += 0
    #        player['points'] = player_points
    #        total_points += player_points
    #        ranked_players.append(player)
    #