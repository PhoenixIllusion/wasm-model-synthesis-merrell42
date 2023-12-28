#include "xmlParser.h"
    
EM_JS(int, __XMLNode_openFileHelper, (const wchar_t*  filename, const wchar_t* tag), {
    const method = Module['XMLReader']['openFileHelper'];
    return method(filename, tag);
});

XMLNode XMLNode::openFileHelper(const wchar_t*  filename, const wchar_t* tag) {
    return XMLNode(__XMLNode_openFileHelper(filename, tag));
}
XMLNode *XMLNode::openFile(const wchar_t*  filename, const wchar_t* tag) {
    return new XMLNode(__XMLNode_openFileHelper(filename, tag));
}
XMLNode XMLNode::getChildNode(int i) const {
    return XMLNode(EM_ASM_INT({
        const method = Module['XMLReader']['getChildNodeN'];
        return method($0, $1);
    }, _id, i));
}
XMLNode XMLNode::getChildNode(const wchar_t* name, int i)  const {
    return XMLNode(EM_ASM_INT({
        const method = Module['XMLReader']['getChildNodeC'];
        return method($0, $1, $2);
    }, _id, name, i));
}
XMLNode XMLNode::getChildNode(const wchar_t* name, int *i) const {
    return XMLNode(EM_ASM_INT({
        const method = Module['XMLReader']['getChildNodeCR'];
        return method($0, $1, $2);
    }, _id, name, i));
}

XMLNode XMLNode::getChildNodeWithAttribute(const wchar_t* tagName,
                                const wchar_t* attributeName,
                                const wchar_t* attributeValue)  const {
    return XMLNode(EM_ASM_INT({
        const method = Module['XMLReader']['getChildNodeWithAttribute'];
        return method($0, $1, $2, $3);
    }, _id, tagName, attributeName, attributeValue));
}

std::string XMLNode::getAttributeStr(const wchar_t* name) const {
    std::string * ret = (std::string *)EM_ASM_PTR({
        const method = Module['XMLReader']['getAttributeStr'];
        return method($0, $1, $2);
    }, _id, name);
    return *ret;
}

int XMLNode::nChildNode(const wchar_t* name) const {
    return EM_ASM_INT({
        const method = Module['XMLReader']['nChildNode'];
        return method($0, $1);
    }, _id, name);
}

std::string XMLNode::getNameStr() const {
    std::string * ret = (std::string *)EM_ASM_PTR({
        const method = Module['XMLReader']['getNameStr'];
        return method($0);
    }, _id);
    return *ret;
}