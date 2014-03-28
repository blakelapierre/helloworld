#!/bin/bash

# http://www.dzone.com/snippets/automatically-push-git-repo

echo 'git push origin master' > .git/hooks/post-commit
chmod 755 .git/hooks/post-commit

