cmake_minimum_required(VERSION 3.13 FATAL_ERROR)
set(CMAKE_POLICY_DEFAULT_CMP0077 NEW)

FIND_PACKAGE(Python3)
set(PYTHON ${Python3_EXECUTABLE} CACHE STRING "Python path")
set(EMSCRIPTEN_ROOT $ENV{EMSDK}/upstream/emscripten CACHE STRING "Emscripten path")
set(CMAKE_TOOLCHAIN_FILE ${EMSCRIPTEN_ROOT}/cmake/Modules/Platform/Emscripten.cmake)
set(WEBIDL_BINDER_SCRIPT ${EMSCRIPTEN_ROOT}/tools/webidl_binder.py)
set(MODEL_SYNTH_FRONT_MATTER_FILE ${CMAKE_CURRENT_SOURCE_DIR}/front-matter.js)
set(MODEL_SYNTH_HEADER_FILE ${CMAKE_CURRENT_SOURCE_DIR}/Merrel42ModelSynth.h)
set(MODEL_SYNTH_IDL_FILE ${CMAKE_CURRENT_SOURCE_DIR}/Merrel42ModelSynth.idl)
set(OUTPUT_FOLDER ${CMAKE_CURRENT_SOURCE_DIR}/dist/)
set(MODEL_SYNTH_TARGETS ${OUTPUT_FOLDER}Merrel42ModelSynth.a)

# The configurations we support
set(CMAKE_CONFIGURATION_TYPES "Debug;Release;Distribution")

# No floating point exception checking
set(FLOATING_POINT_EXCEPTIONS_ENABLED OFF)

# Turn off LTO
set(INTERPROCEDURAL_OPTIMIZATION OFF)

# Turn on symbols
set(GENERATE_DEBUG_SYMBOLS ON)

set(third_party_patch
  cp ${CMAKE_CURRENT_SOURCE_DIR}/em-thirdparty-header/xmlParser.h src/third_party/ &&
  cp ${CMAKE_CURRENT_SOURCE_DIR}/em-thirdparty-header/lodepng.h src/third_party/lodepng/ &&
  cp ${CMAKE_CURRENT_SOURCE_DIR}/em-thirdparty-header/lodepng.cpp src/third_party/lodepng/
  )
# Include Merrel42ModelSynth
include(FetchContent)
FetchContent_Declare(
        merrel42_model_synth
        GIT_REPOSITORY "https://github.com/merrell42/model-synthesis"
        GIT_TAG "2acb31cd465ed515666a933ebd2c80b7f15b4719"
        PATCH_COMMAND ${third_party_patch}
		SOURCE_SUBDIR "Build"
)



FetchContent_MakeAvailable(merrel42_model_synth)
set(MODEL_SYNTH_SOURCE 
  ${merrel42_model_synth_SOURCE_DIR}/src/synthesizer.cpp
  ${merrel42_model_synth_SOURCE_DIR}/src/propagator/Propagator.cpp
  ${merrel42_model_synth_SOURCE_DIR}/src/propagator/PropagatorAc3.cpp
  ${merrel42_model_synth_SOURCE_DIR}/src/propagator/PropagatorAc4.cpp
  ${merrel42_model_synth_SOURCE_DIR}/src/parseInput/InputSettings.cpp
  ${merrel42_model_synth_SOURCE_DIR}/src/parseInput/parseInput.cpp
  ${merrel42_model_synth_SOURCE_DIR}/src/parseInput/parseOverlapping.cpp
  ${merrel42_model_synth_SOURCE_DIR}/src/parseInput/parseSimpleTiled.cpp
  ${merrel42_model_synth_SOURCE_DIR}/src/parseInput/parseTiledModel.cpp
  ${merrel42_model_synth_SOURCE_DIR}/src/third_party/lodepng/lodepng.cpp
  )
set(MODEL_SYNTH_OBJECTS
  synthesizer.o
  Propagator.o
  PropagatorAc3.o
  PropagatorAc4.o
  InputSettings.o
  parseInput.o
  parseOverlapping.o
  parseSimpleTiled.o
  parseTiledModel.o
  lodepng.o
  )

# Default is 64*1024*1024 = 64MB
set(TOTAL_MEMORY 67108864 CACHE STRING "Total Memory")

# Enable for resizable heap, with some amount of slowness
set(ALLOW_MEMORY_GROWTH 0 CACHE STRING "Allow Memory Growth")

set(EMCC_ARGS
  --extern-pre-js ${MODEL_SYNTH_FRONT_MATTER_FILE}
  --post-js glue.js
  --closure=1
  -s ALLOW_MEMORY_GROWTH=${ALLOW_MEMORY_GROWTH}
  -s ALLOW_TABLE_GROWTH=1
  -s ENVIRONMENT='web,node'
  -s EXPORT_ES6=1
  -s EXPORT_NAME="Merrel42ModelSynth"
  -s MODULARIZE=1
  -s NO_EXIT_RUNTIME=1
  -s NO_FILESYSTEM=1
  -s TOTAL_STACK=1048576
  -s TOTAL_MEMORY=${TOTAL_MEMORY})

if ("${CMAKE_BUILD_TYPE}" STREQUAL "Debug")
	set(EMCC_ARGS 
		${EMCC_ARGS} 
		-g
		-s ASSERTIONS)
else()
	set(EMCC_ARGS 
		${EMCC_ARGS} 
		-O3)
endif()

set(EMCC_WASM_ARGS ${EMCC_ARGS}
  -s BINARYEN_IGNORE_IMPLICIT_TRAPS=1
  -s WASM=1)

set(EMCC_WASM_COMPAT_ARGS ${EMCC_WASM_ARGS}
  -s SINGLE_FILE=1)

set(EMCC_GLUE_ARGS
  -c
  -s ASYNCIFY
  -I${merrel42_model_synth_SOURCE_DIR}/src
  -Wall
  -std=c++17
  -include ${MODEL_SYNTH_HEADER_FILE})

# Can't find a way to automatically inherit settings set by target_compile_definitions, so hardcoding defines here
if ("${CMAKE_BUILD_TYPE}" STREQUAL "Debug")
	set(EMCC_GLUE_ARGS
		${EMCC_GLUE_ARGS}
    -g 
		-D_DEBUG)
elseif ("${CMAKE_BUILD_TYPE}" STREQUAL "Release")
	set(EMCC_GLUE_ARGS
		${EMCC_GLUE_ARGS}
		-DNDEBUG)
elseif ("${CMAKE_BUILD_TYPE}" STREQUAL "Distribution")
	set(EMCC_GLUE_ARGS
		${EMCC_GLUE_ARGS}
		-DNDEBUG)
else()
	message("Unknown CMAKE_BUILD_TYPE: ${CMAKE_BUILD_TYPE}")
endif()

#######################################
project("Merrel42ModelSynth.js")

add_custom_command(
  OUTPUT ${MODEL_SYNTH_TARGETS}
  COMMAND emcc ${EMCC_GLUE_ARGS} ${MODEL_SYNTH_SOURCE} -c
  COMMAND emar rcs ${MODEL_SYNTH_TARGETS} ${MODEL_SYNTH_OBJECTS}
  DEPENDS ${MODEL_SYNTH_SOURCE}
  COMMENT "Generating Merrel42ModelSynth.a"
  VERBATIM)
add_custom_target(Merrel42ModelSynth-static ALL DEPENDS ${MODEL_SYNTH_TARGETS})

#######################################
add_custom_command(
  OUTPUT glue.cpp glue.js
  BYPRODUCTS parser.out WebIDLGrammar.pkl
  COMMAND ${PYTHON} ${WEBIDL_BINDER_SCRIPT} ${MODEL_SYNTH_IDL_FILE} glue
  DEPENDS ${MODEL_SYNTH_IDL_FILE}
  COMMENT "Generating Merrel42ModelSynth.js bindings"
  VERBATIM)
add_custom_command(
  OUTPUT glue.o
  COMMAND emcc glue.cpp ${EMCC_GLUE_ARGS} -o glue.o
  DEPENDS glue.cpp ${MODEL_SYNTH_HEADER_FILE}
  COMMENT "Building Merrel42ModelSynth.js bindings"
  VERBATIM)
add_custom_target(Merrel42ModelSynth-bindings ALL DEPENDS glue.js glue.o)

#######################################
add_custom_command(
  OUTPUT ${OUTPUT_FOLDER}Merrel42ModelSynth.wasm.js ${OUTPUT_FOLDER}Merrel42ModelSynth.wasm
  COMMAND emcc glue.o ${MODEL_SYNTH_TARGETS} ${EMCC_WASM_ARGS} -o ${OUTPUT_FOLDER}Merrel42ModelSynth.wasm.js
  DEPENDS Merrel42ModelSynth-bindings Merrel42ModelSynth-static ${MODEL_SYNTH_FRONT_MATTER_FILE} ${MODEL_SYNTH_IDL_FILE} ${MODEL_SYNTH_HEADER_FILE}
  COMMENT "Building Merrel42ModelSynth.js webassembly"
  VERBATIM)
add_custom_target(Merrel42ModelSynth-wasm ALL DEPENDS ${OUTPUT_FOLDER}Merrel42ModelSynth.wasm.js ${OUTPUT_FOLDER}Merrel42ModelSynth.wasm)

#######################################
add_custom_command(
  OUTPUT ${OUTPUT_FOLDER}Merrel42ModelSynth.wasm-compat.js
  COMMAND emcc glue.o ${MODEL_SYNTH_TARGETS} ${EMCC_WASM_COMPAT_ARGS} -o ${OUTPUT_FOLDER}Merrel42ModelSynth.wasm-compat.js
  DEPENDS Merrel42ModelSynth-bindings Merrel42ModelSynth-static ${MODEL_SYNTH_FRONT_MATTER_FILE} ${MODEL_SYNTH_IDL_FILE} ${MODEL_SYNTH_HEADER_FILE}
  COMMENT "Building Merrel42ModelSynth.js compat webassembly"
  VERBATIM)
add_custom_target(Merrel42ModelSynth-wasm-compat ALL DEPENDS ${OUTPUT_FOLDER}Merrel42ModelSynth.wasm-compat.js)