#include "synthesizer.h"
#include "propagator/Propagator.h"
#include "propagator/PropagatorAc3.h"
#include "propagator/PropagatorAc4.h"
#include "parseInput/InputSettings.h"
#include "parseInput/parseInput.h"
#include "parseInput/parseOverlapping.h"
#include "parseInput/parseSimpleTiled.h"
#include "parseInput/parseTiledModel.h"

#include "third_party/xmlParser.h"
#include "third_party/lodepng/lodepng.h"

using Microseconds = std::chrono::microseconds;

using SizeRef = int[3];

using IntRef = int *;
using FloatRef = float *;
using CharRef = unsigned char *;
using WCharRef = wchar_t;

using ModelRef = int***;
using TransitionRef = bool***;

using VectorFloat = vector<float>;

using VectorChar = vector<unsigned char>;
using Vector2Char = vector<VectorChar>;

using VectorInt = vector<int>;
using Vector2Int = vector<VectorInt>;
using Vector3Int = vector<Vector2Int>;

using CString = string;


class Transition {
  public:
    Transition(int numLabels) {
      _numLabels = numLabels;
      _transition = createTransition(numLabels);
    }
    TransitionRef ref() { return _transition;}

    void set(int layer, int aIndex, int bIndex, bool val) {
      _transition[layer][aIndex][bIndex] = val;
    }
    bool get(int layer, int aIndex, int bIndex) {
      return _transition[layer][aIndex][bIndex];
    }
    void remove() {
      deleteTransition(_transition, _numLabels);
    }
  private:
    bool*** _transition;
    int _numLabels;
};

class Model {
  public:
    Model(ModelRef ref) { _ref = ref;}
    long get(long x, long y, long z) {
      return _ref[x][y][z];
    }
  private:
  ModelRef _ref;
};

class Parser {
  public:
  static XMLNode* readXML(const wchar_t*  filename, const wchar_t* tag = NULL) {
    return XMLNode::openFile(filename, tag);
  }
  InputSettings* parse(const XMLNode& node, std::chrono::microseconds& inputTime) {
    return parseInput(node, inputTime);
  }
  void setRandomSeed(int seed) {
    srand(seed);
  }
};

