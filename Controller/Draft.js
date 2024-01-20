// routes/drafts.js
const express = require('express');
const Draft = require('../models/Draft');
const router = express.Router();

// Create a new draft
router.post('/drafts', isLoggedIn, (req, res) => {
  const { title, content, category } = req.body;
  const author = req.user._id;

  const newDraft = new Draft({ title, content, category, author });

  newDraft.save((err, draft) => {
    if (err) {
      req.flash('error', 'Error creating draft');
      res.redirect('/drafts');
    } else {
      req.flash('success', 'Draft saved');
      res.redirect('/drafts');
    }
  });
});

// List all drafts
router.get('/drafts', isLoggedIn, (req, res) => {
  Draft.find({ author: req.user._id }, (err, drafts) => {
    if (err) {
      req.flash('error', 'Error fetching drafts');
      res.redirect('/drafts');
    } else {
      res.render('drafts', { drafts });
    }
  });
});

// Edit a draft
router.get('/drafts/:id/edit', isLoggedIn, (req, res) => {
  const draftId = req.params.id;

  Draft.findById(draftId, (err, draft) => {
    if (err) {
      req.flash('error', 'Draft not found');
      res.redirect('/drafts');
    } else {
      res.render('edit_draft', { draft });
    }
  });
});

// Update a draft
router.put('/drafts/:id', isLoggedIn, (req, res) => {
  const draftId = req.params.id;
  const { title, content, category } = req.body;

  Draft.findByIdAndUpdate(
    draftId,
    { $set: { title, content, category } },
    (err, updatedDraft) => {
      if (err) {
        req.flash('error', 'Error updating draft');
        res.redirect('/drafts');
      } else {
        req.flash('success', 'Draft updated');
        res.redirect('/drafts');
      }
    }
  );
});

// Delete a draft
router.delete('/drafts/:id', isLoggedIn, (req, res) => {
  const draftId = req.params.id;

  Draft.findByIdAndRemove(draftId, (err) => {
    if (err) {
      req.flash('error', 'Error deleting draft');
    } else {
      req.flash('success', 'Draft deleted');
    }
    res.redirect('/drafts');
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'You must be logged in to do that');
  res.redirect('/login');
}

module.exports = router;
