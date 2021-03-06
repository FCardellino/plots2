// jQuery (document).ready function:
$(function() {
  // this click eventHandler assigns $D.selected to the appropriate comment form
  // on pages with multiple comments, $D.selected needs to be accurate so that rich-text changes (bold, italic, etc.) go into the right comment form
  // however, the editor is also used on pages with JUST ONE form, and no other comments, eg. /wiki/new & /wiki/edit, so this code needs to be reusable for that context
  $('.rich-text-button').on('click', function(e) {
    const params = getEditorParams(e.target); // defined in editorHelper.js
    // assign dSelected
    if (params.hasOwnProperty('dSelected')) {
      $D.selected = params['dSelected'];
    }
    $E.initialize(params);
    const action = e.currentTarget.dataset.action // 'bold', 'italic', etc.
    $E[action](); // call the appropriate editor function
  });
});

$E = {
  initialize: function(args) {
    args = args || {}
    // title
    $E.title = $('#title')
    // textarea
    args['textarea'] = args['textarea'] || 'text-input'
    $E.textarea = $('#'+args['textarea'])
    $E.textarea.bind('input propertychange',$E.save)
    // preview
    args['preview'] = args['preview'] || 'preview-main'
    $E.preview = $('#'+args['preview'])
    
    marked.setOptions({
      gfm: true,
      tables: true,
      breaks: true,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      langPrefix: 'language-',
      highlight: function(code, lang) {
        if (lang === 'js') {
          return highlighter.javascript(code);
        }
        return code;
      }
    });
  },
  is_editing: function() {
    return ($E.textarea[0].selectionStart == 0 && $E.textarea[0].selectionEnd == 0)
  },
  refresh: function() {
    // textarea
    $E.textarea = ($D.selected).find('textarea').eq(0);
    $E.textarea.bind('input propertychange',$E.save);
    // preview
    $E.preview = ($D.selected).find('.comment-preview').eq(0);
  },
  // wraps currently selected text in textarea with strings a and b
  wrap: function(a,b,args) {
    // this RegEx is: /wiki/ + any char not "/" + /edit
    const isWikiCommentPage = (/\/wiki\/[^\/]+\/edit/).test(window.location.pathname);
    // we don't need to refresh $E's values if we're on a page with a single comment form, ie. /wiki/new or /wiki/edit
    if (window.location.pathname !== "/wiki/new" && !isWikiCommentPage && $D.selected) {
      this.refresh();
    }
    var len = $E.textarea.val().length;
    var start = $E.textarea[0].selectionStart;
    var end = $E.textarea[0].selectionEnd;
    var sel = $E.textarea.val().substring(start, end);
    if (args && args['fallback']) { // an alternative if nothing has been selected, but we're simply dealing with an insertion point
      sel = args['fallback']
    }
    var replace = a + sel + b;
    if (args && args['newline']) {
      if ($E.textarea[0].selectionStart > 0) replace = "\n"+replace
      replace = replace+"\n\n"
    }
    $E.textarea.val($E.textarea.val().substring(0,start) + replace + $E.textarea.val().substring(end,len));
  },
  bold: function() {
    $E.wrap('**','**')
  },
  italic: function() {
    $E.wrap('_','_')
  },
  link: function(uri) {
    uri = prompt('Enter a URL');
    if (uri === null) { uri = ""; }
    $E.wrap('[', '](' + uri + ')');
  },
  image: function(src) {
    $E.wrap('\n![',']('+src+')\n')
  },
  h1: function() {
    $E.wrap('#','')
  },
  h2: function() {
    $E.wrap('##','')
  },
  h3: function() {
    $E.wrap('###','')
  },
  h4: function() {
    $E.wrap('####','')
  },
  h5: function() {
    $E.wrap('#####','')
  },
  h6: function() {
    $E.wrap('######','')
  },
  h7: function() {
    $E.wrap('#######','')
  },
  // this function is dedicated to Don Blair https://github.com/donblair
  save: function() {
    localStorage.setItem('plots:lastpost',$E.textarea.val())
    localStorage.setItem('plots:lasttitle',$E.title.val())
  },
  recover: function() {
    $E.textarea.val(localStorage.getItem('plots:lastpost'))
    $E.title.val(localStorage.getItem('plots:lasttitle'))
  },
  apply_template: function(template) {
    if($E.textarea.val() == ""){
      $E.textarea.val($E.templates[template])
    }else if(($E.textarea.val() == $E.templates['event']) || ($E.textarea.val() == $E.templates['default']) || ($E.textarea.val() == $E.templates['support'])){
        $E.textarea.val($E.templates[template])
    }else{
      $E.textarea.val($E.textarea.val()+'\n\n'+$E.templates[template])
    }
  },
  templates: {
    'blog': "## The beginning\n\n## What we did\n\n## Why it matters\n\n## How can you help",
    'default': "## What I want to do\n\n## My attempt and results\n\n## Questions and next steps\n\n## Why I'm interested",
    'support': "## Details about the problem\n\n## A photo or screenshot of the setup",
    'event': "## Event details\n\nWhen, where, what\n\n## Background\n\nWho, why",
    'question': "## What I want to do or know\n\n## Background story"
  },
  previewing: false,
  previewed: false,
  generate_preview: function(id,text) {
    $('#'+id)[0].innerHTML = marked(text)
  },
  toggle_preview: function() {
    let previewBtn;
    let dropzone;
    // if the element is part of a multi-comment page,
    // ensure to grab the current element and not the other comment element.
    previewBtn = $(this.textarea.context).find('.preview-btn');
    dropzone = $(this.textarea.context).find('.dropzone');

    $E.preview[0].innerHTML = marked($E.textarea.val());
    $E.preview.toggle();
    dropzone.toggle();

    this.toggleButtonPreviewMode(previewBtn);
  },
  toggleButtonPreviewMode: function (previewBtn) {
    let isPreviewing = previewBtn.attr('data-previewing');

    // If data-previewing attribute is not present -> we are not in "preview" mode
    if (!isPreviewing) {
      previewBtn.attr('data-previewing', 'false');
      isPreviewing = 'false';
    }

    if (isPreviewing === 'false') {
      previewBtn.attr('data-previewing', 'true');

      let previewText = previewBtn.attr('data-previewing-text');
      previewBtn.text(previewText);
    } else {
      previewBtn.attr('data-previewing', 'false');
      previewBtn.text('Preview');
    }
  }
}
