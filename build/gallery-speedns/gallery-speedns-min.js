YUI.add("gallery-speedns",function(B){var A={domainRegex:/((http)|(https)):\/\/[A-Za-z0-9.-]+\//,prefetch:function(){var H=document,I=H.getElementsByTagName("a");var K={},F,D;for(F=0,D=I.length;F<D;F++){var C=I[F].href,G=A.domainRegex.exec(C),E=G[0];K[E]=false;}for(var J in K){if(K.hasOwnProperty(J)){A.prefetchDNSForDomain(J);}}},prefetchDNSForDomain:function(D){if(document.images){var C=new Image(16,16);C.src=D+"favicon.ico";alert("prefetched for domain "+D);}}};B.speedns=A;},"@VERSION@",{requires:["get","event-custom"]});