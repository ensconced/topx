# topx

A tiny state-management library.

Believe it or not, the name topx was not inspired by mobx (I wasn't really aware
of mobx when I first wrote this.) However, the principles are very similar -
topological ordering. It's like a very small, very simple version of mobx,
without the magic (it doesn't do automatic property-tracing so you have to be a
bit more explicit about the dependencies of each data cell)

your program transforms data from one form into another
