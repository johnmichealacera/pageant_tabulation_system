# Pageant Tabulation System - User Manual

**Quick Reference Guide for Students and Administrators**

This manual provides essential information for using the Pageant Tabulation System effectively.

## 📋 Table of Contents
1. [Getting Started](#getting-started)
2. [Login Credentials](#login-credentials)
3. [System Admin Guide](#system-admin-guide)
4. [Judge User Guide](#judge-user-guide)
5. [Public View Guide](#public-view-guide)
6. [Common Tasks](#common-tasks)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Access
- **URL**: Use the provided system URL (e.g., `http://localhost:3000` or your deployment URL)
- **Browser Requirements**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Mobile Access**: System is fully responsive and works on mobile devices

### First Time Setup
The system comes pre-configured with sample data for testing. No initial setup required.

---

## Login Credentials

### 🔐 System Administrator
**Access Level**: Full system control

- **Email**: `admin@pageant.com`
- **Password**: `admin123`
- **Access**: All administrative functions

### 👩‍⚖️ Judge Accounts
**Access Level**: Scoring interface only

Available judge accounts for testing:
- `elena.cruz@college.edu` / `judge123`
- `roberto.santos@college.edu` / `judge123`
- `patricia.reyes@alumni.edu` / `judge123`
- `carlos.mendoza@industry.com` / `judge123`
- `lucia.fernandez@college.edu` / `judge123`

---

## System Admin Guide

### Admin Dashboard Overview
After logging in as admin, you'll see:
- **Event Management**: Create, edit, delete pageant events
- **Statistics**: View counts of contestants, judges, and categories
- **Quick Actions**: Create new events, activate events

### Creating a New Pageant Event

**Step 1**: Click **"Create New Event"** button

**Step 2**: Fill in event details:
- **Event Name**: e.g., "Annual Beauty Pageant 2024"
- **Description**: Optional event description
- **Event Date**: Select the pageant date
- Click **"Create Event"**

**Step 3**: The event is automatically activated and ready for setup

### Managing Contestants

**Adding Contestants:**
1. Navigate to your event
2. Click **"Add Contestant"** in the contestants section
3. Fill in contestant details:
   - Name, Age, Course, Year
   - Upload photo using drag-and-drop or URL
4. Click **"Save Contestant"**

**Editing Contestants:**
1. Find the contestant in the list
2. Click **"Edit"** button
3. Modify details as needed
4. Click **"Update Contestant"**

**Deleting Contestants:**
1. Click **"Delete"** button
2. Confirm deletion (this removes all scores)

### Managing Judges

**Adding Judges:**
1. Navigate to your event
2. Click **"Add Judge"** in the judges section
3. Enter judge details:
   - Name and Role
   - Optionally create a login account with email/password
4. Click **"Save Judge"**

**Creating Judge Login Accounts:**
- Check **"Create login account"** when adding judge
- Enter email and password
- Judge can now login and access scoring interface

**Editing Judges:**
- Click **"Edit"** on any judge
- Update details or password
- Save changes

### Managing Scoring Categories

**Adding Categories:**
1. Navigate to your event
2. Click **"Add Category"** in categories section
3. Choose:
   - **Quick Presets**: 
     - Beauty & Poise (40%)
     - Intelligence (30%)
     - Talent (30%)
   - OR **Custom**: Enter name, max score, and weight
4. **Important**: All weights must total 1.0 (100%)
5. Click **"Save Category"**

**Editing Categories:**
- Click **"Edit"** on any category
- Modify name, max score, or weight
- Save changes

### Generating Reports

**Accessing Reports:**
1. Navigate to your event
2. Click **"View Results"** button
3. View comprehensive report including:
   - Top 3 winners (podium display)
   - Complete rankings
   - Detailed score breakdowns
   - Statistics summary

**Exporting Reports:**
- **CSV Export**: Click **"Export to CSV"** for Excel analysis
- **PDF Export**: Click browser print (Ctrl+P) for PDF

### Event Management

**Activating Events:**
- Click **"Set as Active"** on any event
- Only one event can be active at a time
- Active event appears on public homepage

**Deleting Events:**
- Click **"Delete Event"** 
- **Warning**: This permanently deletes all associated data (contestants, judges, scores)
- Use with caution!

---

## Judge User Guide

### Judge Dashboard Overview
After logging in, judges see:
- **Active Event**: Their assigned pageant event
- **Progress Bar**: Visual completion percentage
- **Statistics**: Total contestants, categories, event date
- **Contestant Grid**: All contestants with score status

### Scoring Contestants

**Step 1**: Click on any contestant card or **"Score"** button

**Step 2**: You'll see:
- Contestant photo and details
- All scoring categories with sliders
- Current score display (if already scored)
- Real-time total calculation

**Step 3**: Adjust scores using sliders:
- Drag slider or enter value manually
- Watch total score update in real-time
- Each category has a maximum score limit

**Step 4**: Click **"Save Scores"** when complete

**Important Notes:**
- You can score the same contestant multiple times (updates previous scores)
- All categories must be scored to save
- Scores cannot be modified after closing the page (must re-enter)

### Tracking Progress

**Progress Indicators:**
- **Progress Bar**: Shows percentage complete (e.g., 60% done)
- **Scored Count**: Number of contestants fully scored
- **Remaining**: Number of contestants not yet scored

**Viewing Scored Contestants:**
- Scored contestants show a **"Review"** button
- Click to view/update previous scores

---

## Public View Guide

### Accessing Public View
- No login required
- Visit the homepage (root URL)
- View active pageant event only

### Available Sections

**1. Contestants Tab**
- View all contestants with photos
- See basic information (name, course, year)
- Grid layout for easy browsing

**2. Scoring Tab**
- Learn about the scoring system
- View all categories and their weights
- See judges and their roles

**3. Rankings Tab**
- **Live leaderboard** updated in real-time
- **Top 3** highlighted with medals (🥇🥈🥉)
- Rankings refresh automatically as judges submit scores

**4. Breakdown Tab**
- Category-by-category analysis
- Percentage distributions
- Statistical summaries

---

## Common Tasks

### Quick Setup Workflow (Admin)

For a new pageant, follow this order:

1. ✅ Login as admin
2. ✅ Create event
3. ✅ Add contestants (with photos)
4. ✅ Add judges (create login accounts)
5. ✅ Add categories (with weights)
6. ✅ Share judge credentials
7. ✅ Judges enter scores
8. ✅ Generate reports
9. ✅ Export results

### Judge Scoring Workflow

1. ✅ Login with judge credentials
2. ✅ View assigned event
3. ✅ Check progress bar
4. ✅ Click on contestant to score
5. ✅ Use sliders for each category
6. ✅ Save scores
7. ✅ Continue with next contestant
8. ✅ Achieve 100% completion

### Uploading Contestant Photos

**Method 1: Drag-and-Drop**
- Click upload area
- Drag image file into box
- Preview appears automatically
- Photo optimizes to WebP format
- Click use image

**Method 2: URL Input**
- Enter image URL directly
- Click "Use URL"
- Image loads instantly

**Tips:**
- Use high-quality photos
- JPG, PNG, WebP formats supported
- Recommended size: 800x1000 pixels
- Photos auto-optimize for web

---

## Troubleshooting

### Login Issues

**Problem**: "Invalid credentials"
- **Solution**: Double-check email/password spelling
- **Solution**: Ensure no extra spaces
- **Solution**: Try password reset (if enabled)

**Problem**: Can't access admin functions
- **Solution**: Verify you logged in as admin@pageant.com
- **Solution**: Clear browser cache and try again

### Scoring Issues

**Problem**: Can't save scores
- **Solution**: Ensure all categories are filled
- **Solution**: Check score values are within range
- **Solution**: Refresh page and try again

**Problem**: Scores not updating
- **Solution**: Refresh the page
- **Solution**: Clear browser cache
- **Solution**: Check internet connection

### Display Issues

**Problem**: Contestant photos not showing
- **Solution**: Check image URL is valid
- **Solution**: Try uploading image again
- **Solution**: System will show placeholder if image fails

**Problem**: Rankings not updating
- **Solution**: Rankings update automatically when judges save
- **Solution**: Refresh page to see latest
- **Solution**: Check if event is active

### Data Issues

**Problem**: Can't delete contestant/judge
- **Solution**: Ensure you're logged in as admin
- **Solution**: Check for confirmation dialog
- **Solution**: Some deletions cascade (remove related scores)

**Problem**: Weights don't add up to 100%
- **Solution**: System validates weights when adding
- **Solution**: Ensure all weights are between 0-1
- **Solution**: Add or adjust categories as needed

### General Issues

**Problem**: Page loads slowly
- **Solution**: Check internet connection
- **Solution**: Clear browser cache
- **Solution**: Try different browser

**Problem**: Missing data
- **Solution**: Verify you're viewing the correct event
- **Solution**: Check if event is active (for public view)
- **Solution**: Ensure data was saved properly

**Problem**: Navigation not working
- **Solution**: Check browser URL is correct
- **Solution**: Use provided navigation buttons
- **Solution**: Refresh page

---

## Best Practices

### For Administrators

✅ **Setup Checklist:**
- Create event first, then add data
- Upload quality contestant photos
- Set weights carefully (must total 1.0)
- Create judge accounts immediately
- Test with demo scores before live event

✅ **Security:**
- Never share admin password
- Create unique passwords for judge accounts
- Deactivate events after completion
- Keep backup of important reports

✅ **Data Management:**
- Delete test events when done
- Keep only active data in system
- Export reports for documentation
- Save CSV files for records

### For Judges

✅ **Scoring Tips:**
- Complete all contestants before deadline
- Use full score range when appropriate
- Be consistent in evaluations
- Save scores frequently
- Review scores before finalizing

✅ **Time Management:**
- Check progress bar regularly
- Score easier categories first if overwhelmed
- Take breaks to maintain focus
- Ask admin for clarification if needed

✅ **Accuracy:**
- Double-check critical scores
- Verify totals are correct
- Don't submit until all categories are scored
- Use "Review" feature to verify entries

---

## System Features Summary

### ✨ Key Features

**For Administrators:**
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Cloud-based image uploads with optimization
- ✅ Real-time progress monitoring
- ✅ Comprehensive reporting with exports
- ✅ Event activation/deactivation
- ✅ Judge account management

**For Judges:**
- ✅ Interactive scoring interface
- ✅ Real-time progress tracking
- ✅ Contestant photo viewing
- ✅ Instant score calculations
- ✅ User-friendly dashboard

**For Public:**
- ✅ Live rankings display
- ✅ No login required
- ✅ Mobile-friendly view
- ✅ Category breakdowns
- ✅ Real-time updates

---

## Support and Resources

### Need Help?

**Common Questions:**
- Check this manual first
- Review the troubleshooting section
- Test with demo credentials

**Technical Support:**
- Contact system administrator
- Report bugs to development team
- Review system documentation

### Additional Resources

- **Project README**: Technical details and setup
- **API Documentation**: For developers
- **Code Repository**: GitHub/GitLab access
- **Sample Data**: Pre-loaded demo content

---

## Quick Reference Card

### Admin Hotkeys
- Create Event → New Event button
- Add Contestant → Event details → Add Contestant
- Add Judge → Event details → Add Judge
- Add Category → Event details → Add Category
- View Report → Event card → View Results
- Export CSV → Report page → Export CSV button

### Judge Hotkeys
- View Event → Login → See dashboard
- Score Contestant → Click contestant card
- Save Scores → Click Save Scores button
- Check Progress → Look at progress bar
- Review Scores → Click Review button

### Public Access
- View Active Event → Visit homepage
- See Rankings → Rankings tab
- View Contestants → Contestants tab
- Learn System → Scoring tab
- Analyze Data → Breakdown tab

---

## Important Reminders

⚠️ **Critical Notes:**

1. **Only ONE active event** at a time
2. **All category weights MUST total 1.0** (100%)
3. **Judge scores cannot be modified** after saving (must re-enter)
4. **Deleting contestants/judges** removes all their scores
5. **Reports are generated** from current data only
6. **Photos upload** to Cloudinary (cloud storage)
7. **Admin has FULL access** - use responsibly
8. **Public view shows** only the active event
9. **Demo data** is provided for testing
10. **Export reports** before deleting events

---

## System Requirements

### Minimum Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for cloud features
- Screen resolution: 1366x768 or higher

### Recommended Setup
- Chrome or Firefox browser
- Desktop or laptop computer
- Stable internet connection
- Screen resolution: 1920x1080

### Mobile Compatibility
- ✅ Smartphones (iOS/Android)
- ✅ Tablets (iPad, Android tablets)
- ✅ Responsive design adapts automatically
- ⚠️ Desktop recommended for admin functions

---

## Glossary

**Active Event**: Currently visible pageant event
**CUID**: Unique identifier for database records
**Cloudinary**: Cloud-based image storage service
**CRUD**: Create, Read, Update, Delete operations
**CSV**: Comma-separated values file format
**JWT**: JSON Web Token for authentication
**Weight**: Percentage value assigned to scoring category
**NextAuth.js**: Authentication library for Next.js
**Prisma ORM**: Database toolkit and ORM
**WebP**: Modern image format for optimization

---

## Version Information

**Current Version**: 1.0.0  
**Last Updated**: 2024  
**Technology Stack**: Next.js 14, TypeScript, PostgreSQL, Cloudinary  
**License**: ISC  

---

**End of User Manual**

For technical documentation, see README.md  
For detailed system architecture, see CHAPTER documents


