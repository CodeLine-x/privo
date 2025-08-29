package com.kohzhirong.privoandroid

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

import android.util.Log
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
          override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages
            // Packages that cannot be autolinked yet can be added manually here, for example:
            // packages.add(MyReactNativePackage())
            // Adding manual registration for our custom native modules
            Log.d("MainApplication", "Adding custom packages")
            try {
              val simpleTestPackage = SimpleTestPackage()
              Log.d("MainApplication", "Created SimpleTestPackage: $simpleTestPackage")
              packages.add(simpleTestPackage)
              
              val testPackage = TestPackage()
              Log.d("MainApplication", "Created TestPackage: $testPackage")
              packages.add(testPackage)
              
              val sensitiveScanPackage = SensitiveScanPackage()
              Log.d("MainApplication", "Created SensitiveScanPackage: $sensitiveScanPackage")
              packages.add(sensitiveScanPackage)
              
              Log.d("MainApplication", "Packages count: ${packages.size}")
            } catch (e: Exception) {
              Log.e("MainApplication", "Error creating packages", e)
            }
            return packages
          }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
          override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    Log.d("MainApplication", "onCreate called")
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
    Log.d("MainApplication", "onCreate completed")
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
