#!/bin/sh

if [ -z $1 ] 
then
	BUILD_TYPE=Distribution
else
	BUILD_TYPE=$1
	shift
fi

rm -rf ./dist
if [ $? -ne 0 ]; then
	exit 1
fi

mkdir dist
if [ $? -ne 0 ]; then
	exit 1
fi

cmake -B Build/$BUILD_TYPE -DCMAKE_BUILD_TYPE=$BUILD_TYPE
if [ $? -ne 0 ]; then
	exit 1
fi

cmake --build Build/$BUILD_TYPE -j`nproc`
if [ $? -ne 0 ]; then
	exit 1
fi

npx webidl-dts-gen -e -d -i ./Merrel42ModelSynth.idl -o ./dist/types.d.ts -n Merrel42ModelSynth
if [ $? -ne 0 ]; then
	exit 1
fi

cat > ./dist/Merrel42ModelSynth.d.ts << EOF
import Merrel42ModelSynth from "./types";

export default Merrel42ModelSynth;
export * from "./types";

EOF
if [ $? -ne 0 ]; then
	exit 1
fi

cp ./dist/Merrel42ModelSynth.d.ts ./dist/Merrel42ModelSynth.wasm.d.ts
if [ $? -ne 0 ]; then
	exit 1
fi

cp ./dist/Merrel42ModelSynth.d.ts ./dist/Merrel42ModelSynth.wasm-compat.d.ts
if [ $? -ne 0 ]; then
	exit 1
fi


mkdir -p ./Examples/js/lib/wasm
cp ./dist/Merrel42ModelSynth.wasm.* ./Examples/js/lib/wasm/.
cp ./dist/types.d.ts ./Examples/js/lib/wasm/.
if [ $? -ne 0 ]; then
	exit 1
fi
