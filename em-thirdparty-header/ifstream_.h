#ifndef IFSTREAM__H
#define IFSTREAM__H

#include <string.h> /*for size_t*/

class ifstream_ {
	public:
		my_ifstream(std::string * path, char flags = 0);
		bool good();
};


#endif