Where we are: Face Race
=======================

3D realtime multiplayer cart-racing game where you race your face *in the browser* or *on your phone* against the other faces on the Internet (or at least in your current race)


    git clone https://github.com/BlakeLaPierre/facerace.git

    cd facerace
    
    git checkout rewrite

    npm install

    bower install


Then play:

    grunt default (to start server and launch Chrome (Win only (I think) right now, sorry))

or

    grunt startServer (to just start the server)


Todo: 

* Communication is fucked up somewhere, I think the client sim isn't getting the new players (not intentional; somewhere in the git history is a working multiplayer version (although I think it stutters occasionally))

* Actual racing...all you can do right now is drive/float around

* Items...boosts...teleports...launchers...shrinkers...traps...anything cool

* Sound recording (very, very early code in) - to be played during the game in response to various events (item uses, etc.)

* When a player brings in a persistent item or effect, everyone in that game benefits (maybe, we have an item that is associated with a certain set of powerups, and those powerups only appear in the game if someone is using that item)

* Probably will want to support world-wide (but also regional/localized...we still have the speed of light (presumably) to deal with) match making, right now you run your own setup -- rooms? lobbies? skill/interest-based matching?

* Racers get some quantity for racing and/or their performance, this quantity can be divided and traded to obtain persistent items or traded among the racers

* I might trim this list down temporarily to focus on the core simulation code, we need to find something fun and that means we need lots of experiments


Extremely likely to be Android/Chrome only right now.


oh yeah, I somehow messed up badly and master is the the latest code (the "rewrite") and the rewrite branch is the old (partially working (you have to go farther back for the (mostly functioning) multiplayer)) code. someone please fix!! I'm not that good at git yet, so once I figure out how to do it, if it's still a problem, I'll fix it



Coming up...[where we are going](https://github.com/blakelapierre/research), perspectives and more
