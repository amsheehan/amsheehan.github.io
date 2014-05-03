function likeMe() {
  var lastOffset;
 
  var likeHandler = function () {
    var scrollOffset = Math.floor(window.scrollY / 300);
   
    if (lastOffset !== scrollOffset) {
      $('.like-me-box').css('display', 'block');
      lastOffset = scrollOffset;
    }

  };
  
  window.addEventListener('scroll', likeHandler, false);

};

function closeLikeMeNowBox() {
  $('.like-me-box').css('display', 'none');
};
