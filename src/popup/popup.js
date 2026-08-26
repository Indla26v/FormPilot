/**
 * Popup Controller for GFAF Chrome Extension
 */

import { StorageService } from '../services/StorageService.js';
import { ICONS } from '../utils/svgIcons.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Inject SVG icons
  document.getElementById('brand-logo-icon').innerHTML = ICONS.zap;
  document.getElementById('hero-sparkle-icon').innerHTML = ICONS.sparkles;
  document.getElementById('icon-options').innerHTML = ICONS.settings;
  document.getElementById('toast-icon').innerHTML = ICONS.checkCircle;

  const btnAutoFill = document.getElementById('btn-autofill');
  const btnOpenOptions = document.getElementById('btn-open-options');
  const profileSelect = document.getElementById('profile-select');
  const summaryName = document.getElementById('summary-name');
  const summaryEmail = document.getElementById('summary-email');
  const summaryPhone = document.getElementById('summary-phone');
  const summaryRole = document.getElementById('summary-role');
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  const popupToast = document.getElementById('popup-toast');
  const toastMsg = document.getElementById('toast-msg');

  // Load profiles and populate select
  async function loadProfileUI() {
    const profiles = await StorageService.getProfiles();
    const active = await StorageService.getActiveProfile();

    profileSelect.innerHTML = '';
    profiles.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      if (p.id === active.id) opt.selected = true;
      profileSelect.appendChild(opt);
    });

    // Populate summary
    summaryName.textContent = active.personal?.fullName || '-';
    summaryEmail.textContent = active.personal?.email || '-';
    summaryPhone.textContent = active.personal?.phone || '-';
    summaryRole.textContent = active.professional?.currentRole || '-';
  }

  await loadProfileUI();

  // Profile switch event
  profileSelect.addEventListener('change', async (e) => {
    await StorageService.setActiveProfileId(e.target.value);
    await loadProfileUI();
    showToast('Profile changed');
  });

  // Check if current tab is a Google Form
  let isGoogleFormTab = false;
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const url = currentTab?.url || '';
      if (url.includes('docs.google.com/forms') || url.includes('forms.gle')) {
        isGoogleFormTab = true;
        statusText.textContent = 'Google Form Ready';
        statusBadge.className = 'status-badge status-ready';
      } else {
        statusText.textContent = 'Standby';
        statusBadge.style.opacity = '0.7';
      }
    });
  }

  // Robust Auto-Fill trigger with programmatic injection fallback
  btnAutoFill.addEventListener('click', async () => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        showToast('No active tab found');
        return;
      }

      const url = activeTab.url || '';
      if (!url.includes('docs.google.com/forms') && !url.includes('forms.gle')) {
        showToast('Please open a Google Form tab');
        return;
      }

      // Try sending direct message to content script
      chrome.tabs.sendMessage(activeTab.id, { action: 'TRIGGER_AUTO_FILL' }, async (response) => {
        if (chrome.runtime.lastError || !response) {
          // Content script was not previously injected (e.g. tab opened prior to extension reload)
          // Programmatically inject content.css and content.js now
          try {
            if (chrome.scripting) {
              await chrome.scripting.insertCSS({
                target: { tabId: activeTab.id },
                files: ['src/content/content.css']
              }).catch(() => {});

              await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['src/content/content.js']
              });

              // Retry message after injection
              setTimeout(() => {
                chrome.tabs.sendMessage(activeTab.id, { action: 'TRIGGER_AUTO_FILL' }, (res) => {
                  if (res && res.filledCount !== undefined) {
                    showToast(`Auto-filled ${res.filledCount} fields!`);
                  } else {
                    showToast('Auto-fill triggered successfully!');
                  }
                });
              }, 200);
            } else {
              showToast('Please refresh the Google Form tab once.');
            }
          } catch (injectErr) {
            console.error('[GFAF] Script injection error:', injectErr);
            showToast('Please refresh the Google Form tab.');
          }
        } else if (response && response.filledCount !== undefined) {
          showToast(`Auto-filled ${response.filledCount} fields!`);
        } else {
          showToast('Form filled successfully');
        }
      });
    });
  });

  // Open Options / Profiles Manager
  btnOpenOptions.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('../options/options.html', '_blank');
    }
  });

  function showToast(message) {
    toastMsg.textContent = message;
    popupToast.classList.remove('hidden');
    setTimeout(() => {
      popupToast.classList.add('hidden');
    }, 2800);
  }
});
