#ifndef IFSTREAM__H
#define IFSTREAM__H

#include <string.h> /*for size_t*/

class ifstream_ {
	public:
    ifstream_(std::string path, char flags = 0);
    
		bool good() {
      return id != -1;
    }
		void getline(char * buffer, int len);

    explicit operator bool();
    static bool exists(const char * path);
    void operator >> (int &i);
    std::string rdbuf();

  private:
    int id = -1;
};


#endif