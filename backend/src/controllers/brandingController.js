const Branding = require('../models/Branding');

// @desc Get current branding config
// @route GET /api/branding
const getBranding = async (req, res) => {
  try {
    let branding = await Branding.findOne();
    if (!branding) {
      branding = await Branding.create({
        appName: 'BuildCRM',
        appShortName: 'BuildCRM',
        tagline: 'Tiles & Sanitary Wares CRM',
        logoType: 'icon',
        logoIcon: 'Box',
        logoImage: '',
        primaryColor: '#2563EB',
      });
    }
    res.json({ success: true, data: branding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update branding config
// @route PUT /api/branding
const updateBranding = async (req, res) => {
  try {
    const { appName, appShortName, tagline, logoType, logoIcon, logoImage, primaryColor } = req.body;

    let branding = await Branding.findOne();
    if (!branding) {
      branding = new Branding();
    }

    if (appName !== undefined) branding.appName = appName.trim();
    if (appShortName !== undefined) branding.appShortName = appShortName.trim();
    if (tagline !== undefined) branding.tagline = tagline.trim();
    if (logoType !== undefined) branding.logoType = logoType;
    if (logoIcon !== undefined) branding.logoIcon = logoIcon;
    if (logoImage !== undefined) branding.logoImage = logoImage;
    if (primaryColor !== undefined) branding.primaryColor = primaryColor;
    branding.updatedAt = new Date();

    await branding.save();

    res.json({
      success: true,
      message: 'Branding updated successfully',
      data: branding,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBranding,
  updateBranding,
};
