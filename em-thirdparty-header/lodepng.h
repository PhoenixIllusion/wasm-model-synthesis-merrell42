#ifndef LODEPNG_H
#define LODEPNG_H

#include <string.h> /*for size_t*/

const char* lodepng_error_text(unsigned code);

namespace lodepng {

  using State = unsigned;

  unsigned encode(const std::string& filename,
                  const std::vector<unsigned char>& in, unsigned w, unsigned h);

  unsigned decode(std::vector<unsigned char>& out, unsigned& w, unsigned& h,
                  State& state,
                  const std::vector<unsigned char>& in);
  unsigned load_file(std::vector<unsigned char>& buffer, const std::string& filename);
}

#endif