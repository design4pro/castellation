export function privateCors(request, webOrigin) {
  const origin=request.headers.get('origin');
  const allowed=!origin || origin===webOrigin || origin==='castellation://';
  const headers=new Headers({'cache-control':'no-store','vary':'Origin'});
  if(origin && allowed){headers.set('access-control-allow-origin',origin);headers.set('access-control-allow-credentials','true');headers.set('access-control-allow-methods','GET, POST, PUT, OPTIONS');headers.set('access-control-allow-headers','content-type, authorization');}
  return {allowed,headers};
}
