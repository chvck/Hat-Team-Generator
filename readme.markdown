# Hat Tournament Team Generator
===============================

This web app is designed to make life easy when creating hat tournaments, that
is tournaments where players enter individually and teams are "randomly" picked
out of a hat. Obviously in principle that method creates unbalanced teams, this app
tries to create teams as balanced as possible.

## TODO
- Wire attribute balancing into the back end - using a player object and setattr should cover this. Not as trivial as I had hoped, waiting for inspiration to strike.
- Fix up the css

## Future
- Blockstack.tv had the idea of extending the app so that tournaments can be created and advertised via the app
- On top of this users would be able to sign themselves up to different tournaments
- This will probably mean moving the app over to django and whacking a relational db on the backend
- Might actually have to buy some hosting!