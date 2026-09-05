const overviewVideo = document.getElementById('overview-video');
document.querySelectorAll('.video-chapters button').forEach(button => {
  button.addEventListener('click', () => {
    overviewVideo.currentTime = Number(button.dataset.time);
    overviewVideo.play().catch(() => overviewVideo.focus());
  });
});
