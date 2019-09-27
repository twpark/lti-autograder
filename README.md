# lti_autograder

node.js (+ docker) based autograder with LTI+OAuth support with Canvas

# Installation and Run

* docker setup doc [TODO]

* npm install
* copy settings.json.origin into settings.json and modify it for your use
 * settings.json overrides settings.json.origin
* see autograder.service for systemd service

* main execution file: app.js

* Running the system at a port < 1024: do the following with sudo
 * iptables -t nat -I PREROUTING -p tcp --dport 443 -j REDIRECT --to-ports [yours]
 * iptables -t nat -I OUTPUT -p tcp -o lo --dport 443 -j REDIRECT --to-ports [yours]

