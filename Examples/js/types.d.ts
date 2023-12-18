export default Merrel42ModelSynth;
declare function Merrel42ModelSynth<T>(target?: T): Promise<T & typeof Merrel42ModelSynth>;
declare module Merrel42ModelSynth {
    function destroy(obj: any): void;
    function _malloc(size: number): number;
    function _free(ptr: number): void;
    function wrapPointer<C extends new (...args: any) => any>(ptr: number, Class: C): InstanceType<C>;
    function getPointer(obj: unknown): number;
    function castObject<C extends new (...args: any) => any>(object: unknown, Class: C): InstanceType<C>;
    function compare(object1: unknown, object2: unknown): boolean;
    const HEAP8: Int8Array;
    const HEAP16: Int16Array;
    const HEAP32: Int32Array;
    const HEAPU8: Uint8Array;
    const HEAPU16: Uint16Array;
    const HEAPU32: Uint32Array;
    const HEAPF32: Float32Array;
    const HEAPF64: Float64Array;
    class Microseconds {
        constructor();
        count(): number;
    }
    class SizeRef {
        get(x: number): number;
        set(x: number, index: number): number;
    }
    class CString {
        constructor(s: string, count: number);
        c_str(): string;
    }
    class ModelRef {
    }
    class CharRef {
        get(x: number): number;
        set(x: number, index: number): number;
    }
    class IntRef {
        get(x: number): number;
        set(x: number, index: number): number;
    }
    class FloatRef {
        get(x: number): number;
        set(x: number, index: number): number;
    }
    class VectorFloat {
        push_back(val: number): void;
        data(): FloatRef;
        get(x: number): number;
        set(x: number, index: number): number;
        size(): number;
        resize(size: number): void;
    }
    class VectorInt {
        push_back(val: number): void;
        data(): IntRef;
        get(x: number): number;
        set(x: number, index: number): number;
        size(): number;
        resize(size: number): void;
    }
    class Vector2Int {
        push_back(val: VectorInt): void;
        get(x: number): VectorInt;
        set(x: VectorInt, index: number): void;
        size(): number;
        resize(size: number): void;
    }
    class Vector3Int {
        push_back(val: Vector2Int): void;
        get(x: number): Vector2Int;
        set(x: Vector2Int, index: number): void;
        size(): number;
        resize(size: number): void;
    }
    class VectorChar {
        push_back(val: number): void;
        data(): CharRef;
        get(x: number): number;
        set(x: number, index: number): void;
        size(): number;
        resize(size: number): void;
    }
    class Vector2Char {
        push_back(val: VectorChar): void;
        get(x: number): VectorChar;
        set(x: VectorChar, index: number): void;
        size(): number;
        resize(size: number): void;
    }
    class TransitionRef {
    }
    class InputSettings {
        constructor();
        get_name(): CString;
        set_name(name: CString): void;
        name: CString;
        get_useAc4(): boolean;
        set_useAc4(useAc4: boolean): void;
        useAc4: boolean;
        get_size(): SizeRef;
        set_size(size: SizeRef): void;
        readonly size: SizeRef;
        get_blockSize(): SizeRef;
        set_blockSize(blockSize: SizeRef): void;
        readonly blockSize: SizeRef;
        get_weights(): VectorFloat;
        set_weights(weights: VectorFloat): void;
        weights: VectorFloat;
        get_numLabels(): number;
        set_numLabels(numLabels: number): void;
        numLabels: number;
        get_transition(): TransitionRef;
        set_transition(transition: TransitionRef): void;
        transition: TransitionRef;
        get_supporting(): Vector3Int;
        set_supporting(supporting: Vector3Int): void;
        supporting: Vector3Int;
        get_supportCount(): Vector2Int;
        set_supportCount(supportCount: Vector2Int): void;
        supportCount: Vector2Int;
        get_tiledModelSuffix(): CString;
        set_tiledModelSuffix(tiledModelSuffix: CString): void;
        tiledModelSuffix: CString;
        get_tileImages(): Vector2Char;
        set_tileImages(tileImages: Vector2Char): void;
        tileImages: Vector2Char;
        get_tileWidth(): number;
        set_tileWidth(tileWidth: number): void;
        tileWidth: number;
        get_tileHeight(): number;
        set_tileHeight(tileHeight: number): void;
        tileHeight: number;
        get_periodic(): boolean;
        set_periodic(periodic: boolean): void;
        periodic: boolean;
        get_numDims(): number;
        set_numDims(numDims: number): void;
        numDims: number;
        get_type(): CString;
        set_type(type: CString): void;
        type: CString;
        get_subset(): CString;
        set_subset(subset: CString): void;
        subset: CString;
        get_periodicInput(): boolean;
        set_periodicInput(periodicInput: boolean): void;
        periodicInput: boolean;
        get_ground(): number;
        set_ground(ground: number): void;
        ground: number;
        get_symmetry(): number;
        set_symmetry(symmetry: number): void;
        symmetry: number;
    }
    class Transition {
        constructor(numLabels: number);
        set(layer: number, aIndex: number, bIndex: number, val: boolean): void;
        get(layer: number, aIndex: number, bIndex: number): boolean;
        ref(): TransitionRef;
        remove(): void;
    }
    class Model {
        constructor(ref: ModelRef);
        get(x: number, y: number, z: number): number;
    }
    class Synthesizer {
        constructor(newSettings: InputSettings, synthesisTime: Microseconds);
        synthesize(synthesisTime: Microseconds): void;
        getModel(): ModelRef;
    }
    class XMLNode {
        constructor(id: number);
    }
    class WCharRef {
    }
    class Parser {
        static readXML(filename: WCharRef, tag?: WCharRef): XMLNode;
        static parse(node: XMLNode, inputTime: Microseconds): InputSettings;
        static setRandomSeed(seed: number): void;
    }
    class Propagator {
        setBlockLabel(label: number, position: SizeRef): boolean;
        removeLabel(label: number, position: SizeRef): boolean;
        resetBlock(): void;
        isPossible(x: number, y: number, z: number, label: number): boolean;
        pickLabel(x: number, y: number, z: number): number;
    }
    class PropagatorAc4 {
        constructor(newSettings: InputSettings, newPossibilitySize: SizeRef, newOffset: SizeRef);
    }
    class PropagatorAc3 {
        constructor(newSettings: InputSettings, newPossibilitySize: SizeRef, newOffset: SizeRef);
    }
}