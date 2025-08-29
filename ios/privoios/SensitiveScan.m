#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SensitiveScan, NSObject)

RCT_EXTERN_METHOD(detectFaces:(NSString *)imagePath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(blurFacesInImage:(NSString *)imagePath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end