
  
Port of https://github.com/merrell42/model-synthesis to use WASM

Has a CPP version of code using emscripten stubs for the CPP Parser routines.

Currently coded to override the 3rd party libraries involving files and use stubs in EM_JS Module.

Has a non-CPP version of the config parsing using the same code ported to typescript.

Typescript parsing of SimpleTiled currently may have slow-down during parsing as it attempts to mimic CPP's usage of a sorted map to ensure exact 1-to-1 output with CPP emscripten build.

Support parsing of SimpleTiled, Overlapping, and TiledModel.
Supports both Ac3 and Ac4 propogators
Supports end-to-end in Emscripten, or Using worker thread with JS driven Synthesizer using either Emscripten or AssemblyScript Ac3/Ac4 propagator.
 
 
#### Models:
- SimpleTiled : loads data file with IMG sources, and produces references to rotated/mirrored versions. Renders in CSS Grid
- Overlapping : loads single image. Processes to build adjacency rules. Renders in single canvas setting pixel values
- TiledModel : loads text files of specific format. Renders in Three JS using (X,Y,Z) 3d volumetric positioning of model locations

#### Emscripten Parser - Main-CPP.TS & Example.TS
- Has minimal port of reading XML files using browser DOM Parser.
- Has stubs for capturing a loaded image data. Fake data returned for simpletiled since algorithms do not use actual image-data during setup
- GIT Patches usage of filestream to string-stream subclass, simple JS layer to just return block of memory of file contents
  
Without configuring and building with Asyncify, CPP parser relies on pre-loading any data to XML, IFStream, and LodePNG prior to execution, since non-asyncify emscripten will not wait for file IO, expecting on-demand data.

#### TypeScript Parser - Main.TS, src/parser files
- Loads all files as async and to a pure javascript data format.
- Delays creation of InputSettings
- Based on commented line (not flagged) will execute CPP emscripten or AssemblyScript version of Propogator (Ac3/Ac4)
- Uses a Worker thread, since with delayed Input Settings all WASM can be done on a thread and results sent to main body post-process.
