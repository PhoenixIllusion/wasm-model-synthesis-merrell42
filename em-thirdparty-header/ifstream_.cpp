#include "ifstream_.h"

EM_JS(const char *, __ifstream_constructor, (const std::string *filename), {
    const method = Module['IFStream']['constructor'];
    return method(filename);
});
EM_JS(bool, __ifstream_exists, (const char *path), {
    const method = Module['IFStream']['exists'];
    return method(path);
});

ifstream_::ifstream_(std::string path, ios_base::openmode which): std::basic_stringstream<char>(__ifstream_constructor(&path), which) {

}

bool ifstream_::exists(const char * path) {
    return __ifstream_exists(path);
}
