package cl.mona.admin;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
public class MainActivity extends Activity {
 private static final String ADMIN_URL="https://heladosmona.github.io/admin.html";
 private static final int FILE_REQUEST=72;
 private WebView webView;
 private ValueCallback<Uri[]> fileCallback;
 @Override public void onCreate(Bundle state){
  super.onCreate(state);
  webView=new WebView(this);setContentView(webView);
  webView.getSettings().setJavaScriptEnabled(true);
  webView.getSettings().setDomStorageEnabled(true);
  webView.getSettings().setAllowFileAccess(false);
  webView.getSettings().setAllowContentAccess(true);
  CookieManager.getInstance().setAcceptCookie(true);
  webView.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
    Uri uri=request.getUrl();
    if("https".equals(uri.getScheme())&&"heladosmona.github.io".equals(uri.getHost()))return false;
    try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}
    catch(ActivityNotFoundException e){Toast.makeText(MainActivity.this,"No se pudo abrir el enlace",Toast.LENGTH_SHORT).show();}
    return true;
   }
  });
  webView.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
    if(fileCallback!=null)fileCallback.onReceiveValue(null);
    fileCallback=callback;
    try{startActivityForResult(params.createIntent(),FILE_REQUEST);return true;}
    catch(Exception e){fileCallback=null;Toast.makeText(MainActivity.this,"No se pudo abrir la galería",Toast.LENGTH_SHORT).show();return false;}
   }
  });
  webView.loadUrl(ADMIN_URL);
 }
 @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
  super.onActivityResult(requestCode,resultCode,data);
  if(requestCode==FILE_REQUEST&&fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode,data));fileCallback=null;}
 }
 @Override public void onBackPressed(){if(webView.canGoBack())webView.goBack();else super.onBackPressed();}
 @Override protected void onDestroy(){if(fileCallback!=null){fileCallback.onReceiveValue(null);fileCallback=null;}webView.destroy();super.onDestroy();}
}
