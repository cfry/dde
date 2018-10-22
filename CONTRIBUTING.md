# Contributing

## LTS branch

DDE supports a two development branches

- `master`: cutting edge DDE development.  The latest releases are created from this branch.
- `lts`: long term stability branch.  Stable and well understood versions of DDE will be maintained on this branch.

The `lts` branch will periodically be caught up with the `master` branch, but during rapid `master` branch development, the `lts` branch maintains a place to back-port fixes or other tweaks to well known and understood releases of DDE.  

When updating the `lts` branch to match the current state of master, use the following procedure.


```console
git fetch # update local repo
git check lts
git reset --hard origin/master # move lts to match origin/master
git push -f # push up the change
git checkout master
git version major # bump the major version of master so thats lts and master can diverge once again
git push && git push --tags
```
