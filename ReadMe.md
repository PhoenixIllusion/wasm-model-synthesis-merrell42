Port of https://github.com/merrell42/model-synthesis to use emscritpen

Currently coded to override the 3rd party libraries involving files and use stubs in EM_JS Module.

Has minimal port of reading XML files using browser DOM Parser.
Has stubs for capturing a loaded image data. Fake data returned for simpletiled since algorithms do not use actual image-data during setup
Without configuring and building with Asyncify, relies on pre-loading any data to XML and LodePNG prior to execution since non-asyncify emscripten will not wait for file IO, expecting on-demand data.
Has stub for interacting with file streams to report existence and basic reading.

Currently only supports SimpleTiled and Overlapping parsing, not yet Model (3d)
Not yet background threading, so will lock up browser during N3 Overlapping