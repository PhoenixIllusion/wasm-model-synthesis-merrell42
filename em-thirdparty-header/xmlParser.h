// Copyright (c) 2021 Paul Merrell
#ifndef XML_NODE
#define XML_NODE

#include <emscripten.h>
#include <vector>

class XMLNode {
public:
    XMLNode(int id) { _id = id;}
    static XMLNode openFileHelper(const wchar_t*  filename, const wchar_t* tag = NULL) {
        return XMLNode(EM_ASM_INT({
            const method = Module['XMLReader']['openFileHelper'];
            return method($0, $1);
        }, filename, tag));
    }
    static XMLNode *openFile(const wchar_t*  filename, const wchar_t* tag = NULL) {
        return new XMLNode(EM_ASM_INT({
            const method = Module['XMLReader']['openFileHelper'];
            return method($0, $1);
        }, filename, tag));
    }
    XMLNode getChildNode(int i=0) const {
        return XMLNode(EM_ASM_INT({
            const method = Module['XMLReader']['getChildNodeN'];
            return method($0, $1);
        }, _id, i));
    }
    XMLNode getChildNode(const wchar_t* name, int i)  const {
        return XMLNode(EM_ASM_INT({
            const method = Module['XMLReader']['getChildNodeC'];
            return method($0, $1, $2);
        }, _id, name, i));
    }
    XMLNode getChildNode(const wchar_t* name, int *i=NULL) const {
        return XMLNode(EM_ASM_INT({
            const method = Module['XMLReader']['getChildNodeCR'];
            return method($0, $1, $2);
        }, _id, name, i));
    }
    
    XMLNode getChildNodeWithAttribute(const wchar_t* tagName,
                                    const wchar_t* attributeName,
                                    const wchar_t* attributeValue=NULL)  const {
        return XMLNode(EM_ASM_INT({
            const method = Module['XMLReader']['getChildNodeWithAttribute'];
            return method($0, $1, $2, $3);
        }, _id, tagName, attributeName, attributeValue));
    }

    std::string getAttributeStr(const wchar_t* name) const {
        std::string * ret = (std::string *)EM_ASM_PTR({
            const method = Module['XMLReader']['getAttributeStr'];
            return method($0, $1, $2);
        }, _id, name);
        return *ret;
    }

    int nChildNode(const wchar_t* name) const {
        return EM_ASM_INT({
            const method = Module['XMLReader']['nChildNode'];
            return method($0, $1);
        }, _id, name);
    }

    std::string getNameStr() const {
        std::string * ret = (std::string *)EM_ASM_PTR({
            const method = Module['XMLReader']['getNameStr'];
            return method($0);
        }, _id);
        return *ret;
    }
private:
    int _id;
};

#endif
