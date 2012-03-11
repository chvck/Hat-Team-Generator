# Hat Tournament Team Generator
===============================

This web app is designed to make life easy when creating hat tournaments, that
is tournaments where players enter individually and teams are "randomly" picked
out of a hat. Obviously in principle that method creates unbalanced teams, this app
tries to create teams as balanced as possible.

## TODO
- Wire attribute balancing into the back end - using a player object and setattr should cover this. Not as trivial as I had hoped, waiting for inspiration to strike.
 + Going to have to split the list of players into x number of lists where x is the number of attributes selected for balancing
 + The list to put the player in will be determined by the players best attribute that is in the selected attributes
 + What happens if 5 attributes are selected to use and a player has 3 that are equal best?
 + Each list will be sorted from best to worst
 + Have to consider if gender balancing is also selected as these lists will have to contained within gender lists too if so
 + Come ooooon inspiration!
- Fix up the css

## Future
- Blockstack.tv had the idea of extending the app so that tournaments can be created and advertised via the app
- On top of this users would be able to sign themselves up to different tournaments
- This will probably mean moving the app over to django and whacking a relational db on the backend
- Might actually have to buy some hosting!