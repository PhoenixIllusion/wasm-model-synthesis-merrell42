#ifndef IFSTREAM__H
#define IFSTREAM__H

#include <string.h> /*for size_t*/
#include <sstream>

class ifstream_ : public std::basic_stringstream<char> {
	public:
    ifstream_(std::string path, ios_base::openmode which = ios_base::in | ios_base::out);
    static bool exists(const char * path);

  private:
    std::basic_stringstream<char> _str;
};


#endif