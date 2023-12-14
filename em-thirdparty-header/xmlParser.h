// Copyright (c) 2021 Paul Merrell
#ifndef XML_NODE
#define XML_NODE

#include <emscripten.h>
#include <vector>

class XMLNode {
public:
    XMLNode(int id) { _id = id;}
    static XMLNode openFileHelper(const wchar_t*  filename, const wchar_t* tag = NULL);
    static XMLNode *openFile(const wchar_t*  filename, const wchar_t* tag = NULL);
    XMLNode getChildNode(int i=0) const;
    XMLNode getChildNode(const wchar_t* name, int i)  const;
    XMLNode getChildNode(const wchar_t* name, int *i=NULL) const;    
    XMLNode getChildNodeWithAttribute(const wchar_t* tagName,
                                    const wchar_t* attributeName,
                                    const wchar_t* attributeValue=NULL)  const;

    std::string getAttributeStr(const wchar_t* name) const;
    int nChildNode(const wchar_t* name) const;
    std::string getNameStr() const;
private:
    int _id;
};

#endif
