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


Get master running -> continuous integration -> dev play-test server


Take out whatever you want. Put in whatever you want. I want to see what you can do. I want a playable demo as soon as possible. There is no reason this shouldn't happen tomorrow, we only have to rollback a few commits to get there, at worst.

It's probably worth doing [local perception filtering](http://0fps.net/2014/02/26/replication-in-networked-games-spacetime-consistency-part-3/). Maybe you already know this, maybe not. It seems promising, I just haven't had the time to completely implement or fully understand it.

For the demo, the most basic feature needed is the client/server (or other architecture you think might be better) sim that let's us see each other moving around in real-time + latency. Again, this exists several commits back in the history (before we  met).

Sorry for the complete lack of comments in the code. Wasn't expecting to get to this so soon. Hopefully it's not too brutal in there.

We want to support as many people in a single race as possible (we can always artificially limit the number based on feedback).

We will need to be able to spin up sim servers on-demand and some central service to coordinate everything.

If this is getting too detailed tell me to back off.

I think we want to get this over to the ONJS repo soon, just not sure on the best course yet. I'm (Blake) still a git noob. Feedback from Rob will be instrumental in this.


Extremely likely to be Android/Chrome only right now.


Coming up...[where we are going](https://github.com/blakelapierre/research), [perspectives](https://github.com/blakelapierre/perspectives), [more](https://github.com/blakelapierre)...


&#35;OccupyNodeJS - Bootstrapping The New Economy