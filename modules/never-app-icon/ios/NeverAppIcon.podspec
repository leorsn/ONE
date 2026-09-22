Pod::Spec.new do |s|
  s.name = 'NeverAppIcon'
  s.version = '1.0.0'
  s.summary = 'NEVER alternate application icon bridge'
  s.description = 'Local Expo module for the existing NEVER icon preference.'
  s.author = 'NEVER'
  s.homepage = 'https://github.com/leorsn/ONE'
  s.license = { :type => 'Proprietary' }
  s.source = { :git => 'https://github.com/leorsn/ONE.git' }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
