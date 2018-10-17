https://www.redbubble.com/people/kiddkai/works/15778138-broserify?grid_pos=94&p=triblend-tee

https://www.spreadshirt.com/node+js+flat+design-A17821752

tshirt: 3b70c726a2b14e1380d385de8078a9e7
http://img.gearment.com/unsafe/fit-in/0x600/filters:fill(blue,1)/3b70c726a2b14e1380d385de8078a9e7

logo: 0be9ce4cb37d4998996a04a15d982574
http://img.gearment.com/K_IZkIQZtjKq60N1WVHDvIgqkyk=/fit-in/100x100/0be9ce4cb37d4998996a04a15d982574


http://img.gearment.com/unsafe/filters:watermark(http://img.gearment.com/Cex-D9dUyOxjb15ObOo1NK52QGs=/fit-in/100x100/1926e7a43d994bdaab72e0069dfe03d8)/img.gearment.com/unsafe/fit-in/0x600/filters:fill(red,1)/3b70c726a2b14e1380d385de8078a9e7



Image to base64
https://gist.github.com/HereChen/e173c64090bea2e2fa51


function toDataUrl(src, callback, outputFormat) {
      var img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = function() {
        var canvas = document.cnoreateElement('CANVAS');
        var ctx = canvas.getContext('2d');
        var dataURL;
        canvas.height = this.height;
        canvas.width = this.width;
        ctx.drawImage(this, 0, 0);
        dataURL = canvas.toDataURL(outputFormat);
        callback(dataURL);
      };
      img.src = src;
      if (img.complete || img.complete === undefined) {
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
        img.src = src;
      }
    }
