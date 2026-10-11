#include <yoga/Yoga.h>
#include <cassert>
#include <cmath>
#include <cstdlib>
#include <iostream>

// Uses the exact Yoga sources shipped with this React Native installation.
int main(int argc, char** argv) {
  assert(argc == 5);
  float sourceWidth = std::atof(argv[1]), sourceHeight = std::atof(argv[2]);
  float widthPercent = std::atof(argv[3]), heightPercent = std::atof(argv[4]);
  const float sizes[][2] = {{428,926},{320,568},{375,812},{390,844},{430,932},{926,428},{156,280}};
  for (auto& size : sizes) for (bool fixed : {false, true}) {
    auto root = YGNodeNew(); auto backdrop = YGNodeNew(); auto image = YGNodeNew(); auto content = YGNodeNew();
    YGNodeStyleSetWidth(root, size[0]); YGNodeStyleSetHeight(root, size[1]);
    YGNodeStyleSetPositionType(backdrop, YGPositionTypeAbsolute);
    YGNodeStyleSetPositionType(image, YGPositionTypeAbsolute);
    for (auto edge : {YGEdgeLeft, YGEdgeTop, YGEdgeRight, YGEdgeBottom}) {
      YGNodeStyleSetPosition(backdrop, edge, 0); YGNodeStyleSetPosition(image, edge, 0);
    }
    // Image.ios.js prepends these explicit dimensions for bundled images.
    YGNodeStyleSetWidth(image, sourceWidth); YGNodeStyleSetHeight(image, sourceHeight);
    if (fixed) { YGNodeStyleSetWidthPercent(image, widthPercent); YGNodeStyleSetHeightPercent(image, heightPercent); }
    YGNodeStyleSetFlexGrow(content, 1);
    YGNodeStyleSetPadding(content, YGEdgeTop, 47); YGNodeStyleSetPadding(content, YGEdgeBottom, 34);
    YGNodeStyleSetPadding(content, YGEdgeLeft, 20); YGNodeStyleSetPadding(content, YGEdgeRight, 20);
    YGNodeInsertChild(root, backdrop, 0); YGNodeInsertChild(backdrop, image, 0); YGNodeInsertChild(root, content, 1);
    YGNodeCalculateLayout(root, size[0], size[1], YGDirectionLTR);
    float w = YGNodeLayoutGetWidth(image), h = YGNodeLayoutGetHeight(image);
    assert(YGNodeLayoutGetLeft(image) == 0 && YGNodeLayoutGetTop(image) == 0);
    assert(std::fabs(w - (fixed ? size[0] : sourceWidth)) < .01);
    assert(std::fabs(h - (fixed ? size[1] : sourceHeight)) < .01);
    std::cout << size[0] << "x" << size[1] << (fixed ? " corrected " : " old ") << w << "x" << h << '\n';
    YGNodeFreeRecursive(root);
  }
}
