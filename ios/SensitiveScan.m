#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SensitiveScan, NSObject)

RCT_EXTERN_METHOD(scanAndBlurSensitiveContent:(NSString *)imagePath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end