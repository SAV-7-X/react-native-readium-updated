# Example App

The example app is used as the basis of building and testing the core library.
If you have an issue that we're unable to reproduce easily, we'll likely ask you
to come here, build and run the example app, and see if you can reproduce it
in that app.

## Building & Running

The most important thing to know about how to run this project is that it uses
the local `react-native-readium-updated` package from the parent directory
(`../`). That means you need to build the core library before running the
example, and if you make a change to the code in the parent directory you need
to rebuild it before reinstalling the example app.

Here are the steps:

### 1. Bootstrap The Library

All commands are going to be run from the root directory. Meaning relative to
this file you should run them from `../`.

`yarn bootstrap`

The bootstrap command builds the parent project and installs it in the `example`.

### 2. Running The App

All commands are going to be run from the root directory. Meaning relative to
this file you should run them from `../`.

**Start Metro**

`yarn example`

**Run iOS or Android**

`yarn example:android`

or

`yarn example:ios`

That's it! You should now be running the example project.
