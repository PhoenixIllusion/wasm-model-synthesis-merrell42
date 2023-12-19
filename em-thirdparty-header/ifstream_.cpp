#include "ifstream_.h"

EM_JS(int, __ifstream_constructor, (const std::string *filename, char flag), {
    const method = Module['IFStream']['constructor'];
    return method(filename, flag);
});
EM_JS(bool, __ifstream_exists, (const char *path), {
    const method = Module['IFStream']['exists'];
    return method(path);
});

EM_JS(void, __ifstream_getline, (int id, void * buffer, int len), {
    const method = Module['IFStream']['getline'];
    return method(id, buffer, len);
});

EM_JS(int, __ifstream_readInt, (int id), {
    const method = Module['IFStream']['readInt'];
    return method(id);
});

EM_JS(std::string *, __ifstream_rdbuf, (int id), {
    const method = Module['IFStream']['rdbuf'];
    return method(id);
});


ifstream_::ifstream_(std::string path, char flags) {
    id = __ifstream_constructor(&path, flags);
}

ifstream_::operator bool() {
      return id >= 0;
}

bool ifstream_::exists(const char * path) {
    return __ifstream_exists(path);
}

void ifstream_::getline(char * buffer, int len) {
    __ifstream_getline(id, buffer, len);
}

void ifstream_::operator >> (int &i)
{
    i = __ifstream_readInt(id);
}
std::string ifstream_::rdbuf() {
    std::string * ret = (std::string *)__ifstream_rdbuf(id);
    return *ret;
}