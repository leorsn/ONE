import ExpoModulesCore
import UIKit

private let wordmarkIconNativeName = "NeverWordmark"

private final class AlternateIconsUnavailableException: Exception, @unchecked Sendable {
  override var reason: String {
    "Alternate app icons are not available for this build."
  }
}

private final class UnknownNeverIconException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Unknown NEVER app icon '\(param)'."
  }
}

public class NeverAppIconModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NeverAppIcon")

    Function("supportsAlternateIcons") {
      return UIApplication.shared.supportsAlternateIcons
    }

    Function("getAppIcon") {
      return UIApplication.shared.alternateIconName == wordmarkIconNativeName ? "wordmark" : "nature"
    }

    AsyncFunction("setAppIconAsync") { (iconName: String, promise: Promise) in
      guard UIApplication.shared.supportsAlternateIcons else {
        promise.reject(AlternateIconsUnavailableException())
        return
      }

      let nativeName: String?
      switch iconName {
      case "nature":
        nativeName = nil
      case "wordmark":
        nativeName = wordmarkIconNativeName
      default:
        promise.reject(UnknownNeverIconException(iconName))
        return
      }

      UIApplication.shared.setAlternateIconName(nativeName) { error in
        if let error {
          promise.reject(error)
          return
        }
        promise.resolve(nil)
      }
    }.runOnQueue(.main)
  }
}
