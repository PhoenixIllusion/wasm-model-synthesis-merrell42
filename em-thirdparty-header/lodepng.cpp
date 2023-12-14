#include "lodepng.h"
#include <emscripten.h>

const char* lodepng_error_text(unsigned code) {
        return (char*) EM_ASM_PTR({
            const method = Module['lodepng']['error_text'];
            return method($0);
        }, code);
}


unsigned lodepng::encode(const std::string& filename,
                const std::vector<unsigned char>& in, unsigned w, unsigned h){
      return EM_ASM_INT({
          const method = Module['lodepng']['encode'];
          return method($0, $1, $2, $3, $4);
      }, &in, w, h);
}

unsigned lodepng::decode(std::vector<unsigned char>& out, unsigned& w, unsigned& h,
                State& state,
                const std::vector<unsigned char>& in) {
      return EM_ASM_INT({
          const method = Module['lodepng']['decode'];
          return method($0, $1, $2, $3, $4);
      }, &out, &w, &h, &state, &in);
}
unsigned lodepng::load_file(std::vector<unsigned char>& buffer, const std::string& filename) {
      return EM_ASM_INT({
          const method = Module['lodepng']['load_file'];
          return method($0, $1);
      }, &buffer, &filename);
}
  