const getYoutubeVideoUploadDate = () =>
  document.querySelector('meta[itemprop="uploadDate"]')?.content;

const getTabsUploadDates = (tabs, index, callback) => {
  const tab = tabs[index];
  const { id: tabId, title: tabTitle } = tab;

  chrome.tabs.executeScript(
    tabId,
    { code: `(${getYoutubeVideoUploadDate.toString()})()` },
    ([uploadDate]) => {
      tabs[index].uploadDate = new Date(uploadDate);

      const nextTabIndex = index + 1;
      if (nextTabIndex === tabs.length) {
        callback?.();
        return;
      }

      getTabsUploadDates(tabs, nextTabIndex, callback);
    }
  );
};

const byUploadDate = (
  { uploadDate: firstTabUploadDate },
  { uploadDate: secondTabUploadDate }
) => {
  if (firstTabUploadDate < secondTabUploadDate) {
    return -1;
  } else if (firstTabUploadDate > secondTabUploadDate) {
    return 1;
  }
  return 0;
};

const moveTabs = (tabs, index, callback) => {
  const tab = tabs[index];
  const { id: tabId, title: tabTitle, index: currentIndex } = tab;
  const newIndex = index;

  chrome.tabs.move(tabId, { index: newIndex }, () => {
    const nextTabIndex = index + 1;
    if (nextTabIndex === tabs.length) {
      callback?.();
      return;
    }

    moveTabs(tabs, nextTabIndex, callback);
  });
};

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.query(
    { currentWindow: true, url: '*://*.youtube.com/watch?v=*' },
    (tabs) => {
      const tabsCount = tabs.length;

      if (tabsCount === 0) return;

      getTabsUploadDates(tabs, 0, (tabsWithUploadDates) => {
        tabs.sort(byUploadDate);

        moveTabs(tabs, 0);
      });
    }
  );
});
