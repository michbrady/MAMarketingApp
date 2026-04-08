# Component Specifications - UnFranchise Marketing App

## Table of Contents
1. [Layout Components](#1-layout-components)
2. [Content Components](#2-content-components)
3. [Share Components](#3-share-components)
4. [Contact Components](#4-contact-components)
5. [Engagement Components](#5-engagement-components)
6. [Admin Components](#6-admin-components)
7. [Form Components](#7-form-components)
8. [Shared Components](#8-shared-components)

---

## 1. Layout Components

### 1.1 Header Component

**File**: `src/components/layout/Header.tsx`

**Purpose**: Main application header with navigation, search, and user actions

**Props**:
```typescript
interface HeaderProps {
  variant?: 'ufo' | 'admin';
  showSearch?: boolean;
  onSearchChange?: (query: string) => void;
}
```

**Structure**:
```tsx
<header className="sticky top-0 z-50 bg-white border-b">
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between h-16">
      {/* Left: Logo + Navigation (desktop) */}
      <div className="flex items-center gap-4">
        <Logo />
        <nav className="hidden md:flex gap-2">
          <NavLink />
        </nav>
      </div>

      {/* Center: Search (if enabled) */}
      {showSearch && (
        <div className="flex-1 max-w-xl mx-4">
          <SearchBar />
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu />
        <MobileMenuButton className="md:hidden" />
      </div>
    </div>
  </div>
</header>
```

**Features**:
- Sticky positioning
- Responsive layout
- Search integration
- Notification badge
- User dropdown menu
- Mobile menu toggle

**Responsive Behavior**:
- Desktop: Full navigation in header
- Tablet: Collapsed navigation, search
- Mobile: Hamburger menu, hide search (or show in drawer)

---

### 1.2 Sidebar Component

**File**: `src/components/layout/Sidebar.tsx`

**Purpose**: Main navigation sidebar for desktop

**Props**:
```typescript
interface SidebarProps {
  variant?: 'ufo' | 'admin';
  isOpen?: boolean;
  onToggle?: () => void;
}
```

**Structure**:
```tsx
<aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r">
  <div className="flex flex-col h-full">
    {/* Branding */}
    <div className="p-4 border-b">
      <Logo />
    </div>

    {/* Navigation */}
    <nav className="flex-1 overflow-y-auto p-4">
      <NavGroup title="Main">
        <NavItem icon={HomeIcon} label="Dashboard" href="/dashboard" />
        <NavItem icon={LibraryIcon} label="Content" href="/content" />
        {/* ... */}
      </NavGroup>
    </nav>

    {/* Footer */}
    <div className="p-4 border-t">
      <QuickActions />
    </div>
  </div>
</aside>
```

**Features**:
- Fixed positioning
- Collapsible (desktop)
- Active state indicators
- Icon + label navigation
- Nested navigation support
- Scroll shadows when content overflows

**States**:
- Open (default desktop)
- Collapsed (icon only)
- Hidden (mobile)

---

### 1.3 MobileNav Component

**File**: `src/components/layout/MobileNav.tsx`

**Purpose**: Bottom navigation bar for mobile

**Props**:
```typescript
interface MobileNavProps {
  variant?: 'ufo' | 'admin';
}
```

**Structure**:
```tsx
<nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t md:hidden">
  <div className="flex items-center justify-around h-16">
    <NavButton icon={HomeIcon} label="Home" href="/dashboard" />
    <NavButton icon={LibraryIcon} label="Content" href="/content" />
    <NavButton icon={ShareIcon} label="Share" href="/share" />
    <NavButton icon={ContactsIcon} label="Contacts" href="/contacts" />
    <NavButton icon={MenuIcon} label="More" onClick={openMenu} />
  </div>
</nav>
```

**Features**:
- Fixed bottom positioning
- Touch-friendly buttons (min 48px)
- Active state indicators
- Badge support (notifications)
- Max 5 items

**Responsive Behavior**:
- Mobile only (hidden on md+)
- Safe area insets for iOS

---

### 1.4 Breadcrumbs Component

**File**: `src/components/layout/Breadcrumbs.tsx`

**Purpose**: Navigation trail for deep pages

**Props**:
```typescript
interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType;
}
```

**Example**:
```tsx
<Breadcrumbs
  items={[
    { label: 'Content', href: '/content' },
    { label: 'Product Videos', href: '/content?category=videos' },
    { label: 'Product Demo Video' },
  ]}
/>
```

**Features**:
- Auto-truncate on mobile
- Separator icons
- Last item not clickable
- Keyboard navigable

---

## 2. Content Components

### 2.1 ContentCard Component

**File**: `src/components/content/ContentCard.tsx`

**Purpose**: Display content item in grid or list view

**Props**:
```typescript
interface ContentCardProps {
  content: ContentItem;
  variant?: 'grid' | 'list';
  showActions?: boolean;
  onShare?: (content: ContentItem) => void;
  onFavorite?: (content: ContentItem) => void;
  onPreview?: (content: ContentItem) => void;
}
```

**Structure (Grid Variant)**:
```tsx
<Card className="group cursor-pointer hover:shadow-lg transition-shadow">
  {/* Thumbnail */}
  <div className="relative aspect-video overflow-hidden">
    <Image
      src={content.thumbnailUrl}
      alt={content.title}
      fill
      className="object-cover group-hover:scale-105 transition-transform"
    />

    {/* Content Type Badge */}
    <Badge className="absolute top-2 left-2">
      {content.contentType}
    </Badge>

    {/* Quick Actions (on hover) */}
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
      <IconButton icon={EyeIcon} onClick={onPreview} />
      <IconButton icon={ShareIcon} onClick={onShare} />
    </div>
  </div>

  {/* Content Info */}
  <CardContent className="p-4">
    <h3 className="font-semibold line-clamp-2">{content.title}</h3>
    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
      {content.description}
    </p>

    {/* Metadata */}
    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <ShareIcon className="w-3 h-3" />
        {content.shareCount} shares
      </span>
      <span className="flex items-center gap-1">
        <ActivityIcon className="w-3 h-3" />
        {content.engagementCount} clicks
      </span>
    </div>

    {/* Tags */}
    <div className="flex flex-wrap gap-1 mt-2">
      {content.tags.slice(0, 3).map(tag => (
        <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
      ))}
    </div>
  </CardContent>

  {/* Favorite Button */}
  <Button
    variant="ghost"
    size="icon"
    className="absolute top-2 right-2"
    onClick={onFavorite}
  >
    <HeartIcon className={content.isFavorite ? 'fill-red-500' : ''} />
  </Button>
</Card>
```

**Structure (List Variant)**:
```tsx
<Card className="flex gap-4 p-4 hover:bg-muted/50 transition-colors">
  {/* Thumbnail */}
  <div className="w-32 aspect-video flex-shrink-0 overflow-hidden rounded">
    <Image src={content.thumbnailUrl} alt={content.title} />
  </div>

  {/* Content Info */}
  <div className="flex-1 min-w-0">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="font-semibold">{content.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {content.description}
        </p>
      </div>
      <Button variant="ghost" size="icon" onClick={onFavorite}>
        <HeartIcon />
      </Button>
    </div>

    {/* Metadata */}
    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
      <Badge>{content.contentType}</Badge>
      <span>{content.shareCount} shares</span>
      <span>{content.engagementCount} clicks</span>
    </div>
  </div>

  {/* Actions */}
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm" onClick={onPreview}>
      Preview
    </Button>
    <Button size="sm" onClick={onShare}>
      Share
    </Button>
  </div>
</Card>
```

**States**:
- Default
- Hover (show actions overlay)
- Loading (skeleton)
- Favorited (filled heart icon)
- Selected (checkbox variant for admin)

**Accessibility**:
- Alt text for images
- ARIA labels for icon buttons
- Keyboard navigable
- Focus visible

---

### 2.2 ContentGrid Component

**File**: `src/components/content/ContentGrid.tsx`

**Purpose**: Grid layout for content cards with loading states

**Props**:
```typescript
interface ContentGridProps {
  content: ContentItem[];
  isLoading?: boolean;
  variant?: 'grid' | 'list';
  columns?: 2 | 3 | 4;
  onLoadMore?: () => void;
  hasMore?: boolean;
}
```

**Structure**:
```tsx
<div>
  {/* Grid */}
  <div className={cn(
    "grid gap-6",
    columns === 2 && "grid-cols-1 md:grid-cols-2",
    columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  )}>
    {content.map(item => (
      <ContentCard key={item.id} content={item} variant={variant} />
    ))}

    {/* Loading Skeletons */}
    {isLoading && Array.from({ length: 6 }).map((_, i) => (
      <ContentCardSkeleton key={i} />
    ))}
  </div>

  {/* Load More */}
  {hasMore && (
    <div className="flex justify-center mt-8">
      <Button onClick={onLoadMore} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Load More'}
      </Button>
    </div>
  )}

  {/* Infinite Scroll Trigger */}
  <div ref={loadMoreRef} className="h-4" />
</div>
```

**Features**:
- Responsive grid columns
- Skeleton loading states
- Infinite scroll support
- Load more button
- Empty state

---

### 2.3 ContentDetail Component

**File**: `src/components/content/ContentDetail.tsx`

**Purpose**: Full content detail view with preview

**Props**:
```typescript
interface ContentDetailProps {
  content: ContentItem;
  onShare?: () => void;
  onFavorite?: () => void;
}
```

**Structure**:
```tsx
<div className="max-w-6xl mx-auto">
  <div className="grid lg:grid-cols-2 gap-8">
    {/* Left: Media Preview */}
    <div className="space-y-4">
      {/* Main Media */}
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        {content.contentType === 'video' && (
          <VideoPlayer src={content.mediaUrl} />
        )}
        {content.contentType === 'image' && (
          <Image src={content.mediaUrl} alt={content.title} />
        )}
        {/* ... other types */}
      </div>

      {/* Related Content */}
      <div>
        <h3 className="font-semibold mb-3">Related Content</h3>
        <div className="grid grid-cols-3 gap-2">
          {relatedContent.map(item => (
            <ContentThumbnail key={item.id} content={item} />
          ))}
        </div>
      </div>
    </div>

    {/* Right: Content Info */}
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <Badge>{content.contentType}</Badge>
          <Button variant="ghost" size="icon" onClick={onFavorite}>
            <HeartIcon />
          </Button>
        </div>
        <h1 className="text-3xl font-bold">{content.title}</h1>
        {content.subtitle && (
          <p className="text-lg text-muted-foreground mt-1">
            {content.subtitle}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <h3 className="font-semibold mb-2">Description</h3>
        <p className="text-muted-foreground">{content.description}</p>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Category</span>
          <p className="font-medium">{content.category}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Language</span>
          <p className="font-medium">{content.language}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Shares</span>
          <p className="font-medium">{content.shareCount}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Engagement</span>
          <p className="font-medium">{content.engagementCount} clicks</p>
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="font-semibold mb-2">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {content.tags.map(tag => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button className="w-full" size="lg" onClick={onShare}>
          <ShareIcon className="mr-2" />
          Share Now
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline">
            <LinkIcon className="mr-2" />
            Copy Link
          </Button>
          <Button variant="outline">
            <HistoryIcon className="mr-2" />
            View History
          </Button>
        </div>
      </div>

      {/* Available Channels */}
      <div>
        <h3 className="font-semibold mb-2">Available Channels</h3>
        <div className="flex gap-2">
          {content.channels.map(channel => (
            <Badge key={channel} variant="secondary">
              {getChannelIcon(channel)}
              {channel}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>
```

**Features**:
- Media preview (video, image, PDF)
- Full metadata display
- Related content
- Share CTA
- Copy link functionality
- Responsive layout

---

### 2.4 SearchBar Component

**File**: `src/components/content/SearchBar.tsx`

**Purpose**: Global content search with autocomplete

**Props**:
```typescript
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  showSuggestions?: boolean;
  recentSearches?: string[];
}
```

**Structure**:
```tsx
<div className="relative">
  <div className="relative">
    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
    <Input
      type="search"
      placeholder={placeholder}
      value={query}
      onChange={handleChange}
      onFocus={() => setShowDropdown(true)}
      className="pl-10 pr-10"
    />
    {query && (
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 -translate-y-1/2"
        onClick={clearSearch}
      >
        <XIcon />
      </Button>
    )}
  </div>

  {/* Suggestions Dropdown */}
  {showDropdown && (
    <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg z-50">
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="p-2">
          <div className="text-xs text-muted-foreground mb-2">Recent</div>
          {recentSearches.map(search => (
            <button
              key={search}
              className="w-full text-left px-3 py-2 hover:bg-muted rounded"
              onClick={() => setQuery(search)}
            >
              <ClockIcon className="inline w-4 h-4 mr-2" />
              {search}
            </button>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-2 border-t">
          <div className="text-xs text-muted-foreground mb-2">Suggestions</div>
          {suggestions.map(item => (
            <Link
              key={item.id}
              href={`/content/${item.id}`}
              className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded"
            >
              <Image src={item.thumbnailUrl} className="w-10 h-10 rounded" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {item.category}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )}
</div>
```

**Features**:
- Debounced search
- Autocomplete suggestions
- Recent searches
- Clear button
- Keyboard navigation (arrow keys, enter, escape)
- Mobile-friendly

---

### 2.5 CategoryFilter Component

**File**: `src/components/content/CategoryFilter.tsx`

**Purpose**: Multi-select filter for categories, tags, etc.

**Props**:
```typescript
interface CategoryFilterProps {
  categories: Category[];
  selected: string[];
  onChange: (selected: string[]) => void;
  variant?: 'checkbox' | 'chips';
}
```

**Structure (Checkbox Variant)**:
```tsx
<div className="space-y-2">
  <Label>Categories</Label>
  <ScrollArea className="h-64">
    <div className="space-y-2">
      {categories.map(category => (
        <label key={category.id} className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={selected.includes(category.id)}
            onCheckedChange={() => toggleCategory(category.id)}
          />
          <span>{category.name}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            ({category.count})
          </span>
        </label>
      ))}
    </div>
  </ScrollArea>
</div>
```

**Structure (Chips Variant)**:
```tsx
<div className="space-y-2">
  <Label>Categories</Label>
  <div className="flex flex-wrap gap-2">
    {categories.map(category => (
      <Badge
        key={category.id}
        variant={selected.includes(category.id) ? 'default' : 'outline'}
        className="cursor-pointer"
        onClick={() => toggleCategory(category.id)}
      >
        {category.name}
        {selected.includes(category.id) && (
          <XIcon className="ml-1 w-3 h-3" />
        )}
      </Badge>
    ))}
  </div>
</div>
```

---

## 3. Share Components

### 3.1 ShareModal Component

**File**: `src/components/share/ShareModal.tsx`

**Purpose**: Multi-step wizard for sharing content

**Props**:
```typescript
interface ShareModalProps {
  content: ContentItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (shareEvent: ShareEvent) => void;
}
```

**Structure**:
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-2xl">
    {/* Header */}
    <DialogHeader>
      <DialogTitle>Share Content</DialogTitle>
      <DialogDescription>
        {content.title}
      </DialogDescription>
    </DialogHeader>

    {/* Step Indicator */}
    <StepIndicator currentStep={step} totalSteps={4} />

    {/* Step Content */}
    <div className="py-4">
      {step === 1 && <ChannelSelector onSelect={setChannel} />}
      {step === 2 && <RecipientPicker onSelect={setRecipients} />}
      {step === 3 && <MessageComposer message={message} onChange={setMessage} />}
      {step === 4 && <SharePreview data={shareData} />}
    </div>

    {/* Footer */}
    <DialogFooter>
      <Button variant="outline" onClick={handleBack} disabled={step === 1}>
        Back
      </Button>
      <Button onClick={handleNext} disabled={!canProceed}>
        {step === 4 ? 'Send' : 'Next'}
      </Button>
    </DialogFooter>

    {/* Success State */}
    {showSuccess && (
      <div className="absolute inset-0 bg-white flex flex-col items-center justify-center">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Shared Successfully!</h3>
        <p className="text-muted-foreground mb-6">Your content has been shared.</p>
        <div className="flex gap-2">
          <Button onClick={onClose}>Done</Button>
          <Button variant="outline" onClick={handleShareAnother}>
            Share Another
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
```

**Steps**:
1. Channel Selection
2. Recipient Selection
3. Message Composition
4. Preview & Confirm
5. Success (overlay)

**Features**:
- Multi-step wizard
- Progress indicator
- Validation per step
- Back/Next navigation
- Success overlay
- Mobile full-screen on small devices

---

### 3.2 ChannelSelector Component

**File**: `src/components/share/ChannelSelector.tsx`

**Purpose**: Select sharing channel (SMS, Email, Social)

**Props**:
```typescript
interface ChannelSelectorProps {
  onSelect: (channel: Channel) => void;
  selected?: Channel;
  availableChannels: Channel[];
}
```

**Structure**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <ChannelCard
    icon={MessageSquareIcon}
    label="SMS"
    description="Send via text message"
    isAvailable={availableChannels.includes('sms')}
    isSelected={selected === 'sms'}
    onClick={() => onSelect('sms')}
  />

  <ChannelCard
    icon={MailIcon}
    label="Email"
    description="Send via email"
    isAvailable={availableChannels.includes('email')}
    isSelected={selected === 'email'}
    onClick={() => onSelect('email')}
  />

  <ChannelCard
    icon={Share2Icon}
    label="Social"
    description="Share on social media"
    isAvailable={availableChannels.includes('social')}
    isSelected={selected === 'social'}
    onClick={() => onSelect('social')}
  />
</div>
```

**ChannelCard Sub-Component**:
```tsx
<Card
  className={cn(
    "cursor-pointer transition-all",
    isSelected && "border-primary ring-2 ring-primary",
    !isAvailable && "opacity-50 cursor-not-allowed"
  )}
  onClick={isAvailable ? onClick : undefined}
>
  <CardContent className="flex flex-col items-center text-center p-6">
    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="font-semibold mb-1">{label}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
    {isSelected && (
      <CheckIcon className="absolute top-2 right-2 text-primary" />
    )}
    {!isAvailable && (
      <Badge variant="secondary" className="mt-2">Not Available</Badge>
    )}
  </CardContent>
</Card>
```

---

### 3.3 RecipientPicker Component

**File**: `src/components/share/RecipientPicker.tsx`

**Purpose**: Select recipients (contacts or manual entry)

**Props**:
```typescript
interface RecipientPickerProps {
  channel: Channel;
  onSelect: (recipients: Recipient[]) => void;
  selected: Recipient[];
}
```

**Structure**:
```tsx
<div className="space-y-4">
  {/* Search Contacts */}
  <div>
    <Label>Search Contacts</Label>
    <Input
      type="search"
      placeholder="Search by name, email, or phone..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </div>

  {/* Selected Recipients */}
  {selected.length > 0 && (
    <div>
      <Label>Selected ({selected.length})</Label>
      <div className="flex flex-wrap gap-2 mt-2">
        {selected.map(recipient => (
          <Badge key={recipient.id} className="pr-1">
            {recipient.name}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1"
              onClick={() => removeRecipient(recipient.id)}
            >
              <XIcon className="w-3 h-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  )}

  {/* Contact List */}
  <div>
    <Label>Recent Contacts</Label>
    <ScrollArea className="h-64 border rounded-lg mt-2">
      <div className="p-2 space-y-1">
        {filteredContacts.map(contact => (
          <label
            key={contact.id}
            className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
          >
            <Checkbox
              checked={isSelected(contact.id)}
              onCheckedChange={() => toggleContact(contact)}
            />
            <Avatar className="w-8 h-8">
              <AvatarFallback>{contact.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{contact.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {channel === 'sms' ? contact.phone : contact.email}
              </div>
            </div>
          </label>
        ))}
      </div>
    </ScrollArea>
  </div>

  {/* Manual Entry */}
  <div>
    <Label>Or enter manually</Label>
    <div className="flex gap-2 mt-2">
      <Input
        type={channel === 'sms' ? 'tel' : 'email'}
        placeholder={channel === 'sms' ? 'Phone number' : 'Email address'}
        value={manualEntry}
        onChange={(e) => setManualEntry(e.target.value)}
      />
      <Button onClick={addManualEntry} disabled={!isValidEntry}>
        Add
      </Button>
    </div>
  </div>
</div>
```

**Features**:
- Search contacts
- Multi-select with checkboxes
- Selected recipients display
- Manual entry option
- Validation (email/phone format)
- Recent contacts prioritized

---

### 3.4 MessageComposer Component

**File**: `src/components/share/MessageComposer.tsx`

**Purpose**: Compose share message with approved templates

**Props**:
```typescript
interface MessageComposerProps {
  channel: Channel;
  content: ContentItem;
  message: string;
  onChange: (message: string) => void;
}
```

**Structure**:
```tsx
<div className="space-y-4">
  {/* Template Selector (if available) */}
  {templates.length > 0 && (
    <div>
      <Label>Use Template</Label>
      <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a template..." />
        </SelectTrigger>
        <SelectContent>
          {templates.map(template => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )}

  {/* Subject (Email only) */}
  {channel === 'email' && (
    <div>
      <Label>Subject</Label>
      <Input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Email subject"
      />
    </div>
  )}

  {/* Message Body */}
  <div>
    <Label>Message</Label>
    <Textarea
      value={message}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Add a personal message..."
      rows={channel === 'sms' ? 4 : 8}
      maxLength={channel === 'sms' ? 160 : undefined}
    />
    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
      <span>{content.allowPersonalNote ? 'Personal message allowed' : 'Using approved copy'}</span>
      {channel === 'sms' && (
        <span>{message.length}/160 characters</span>
      )}
    </div>
  </div>

  {/* Personalization Tags */}
  {content.allowPersonalNote && (
    <div>
      <Label>Personalization</Label>
      <div className="flex flex-wrap gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => insertTag('{firstName}')}
        >
          Insert First Name
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => insertTag('{company}')}
        >
          Insert Company
        </Button>
      </div>
    </div>
  )}

  {/* Tracking Link Preview */}
  <Alert>
    <InfoIcon className="h-4 w-4" />
    <AlertTitle>Tracking Link</AlertTitle>
    <AlertDescription>
      A unique tracking link will be included in your message.
    </AlertDescription>
  </Alert>
</div>
```

**Features**:
- Template selection
- Subject line (email)
- Character count (SMS)
- Personalization tags
- Validation
- Preview tracking link

---

### 3.5 SharePreview Component

**File**: `src/components/share/SharePreview.tsx`

**Purpose**: Preview message before sending

**Props**:
```typescript
interface SharePreviewProps {
  data: {
    channel: Channel;
    recipients: Recipient[];
    subject?: string;
    message: string;
    trackingLink: string;
    content: ContentItem;
  };
}
```

**Structure**:
```tsx
<div className="space-y-6">
  {/* Summary */}
  <Card>
    <CardHeader>
      <CardTitle>Share Summary</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div>
        <span className="text-sm text-muted-foreground">Channel:</span>
        <div className="font-medium capitalize">{data.channel}</div>
      </div>
      <div>
        <span className="text-sm text-muted-foreground">Recipients:</span>
        <div className="font-medium">{data.recipients.length} contact(s)</div>
        <div className="text-sm text-muted-foreground mt-1">
          {data.recipients.map(r => r.name).join(', ')}
        </div>
      </div>
      <div>
        <span className="text-sm text-muted-foreground">Content:</span>
        <div className="font-medium">{data.content.title}</div>
      </div>
    </CardContent>
  </Card>

  {/* Message Preview */}
  <Card>
    <CardHeader>
      <CardTitle>Message Preview</CardTitle>
    </CardHeader>
    <CardContent>
      {data.channel === 'email' ? (
        <div className="space-y-3">
          <div className="border-b pb-2">
            <div className="text-sm text-muted-foreground">Subject:</div>
            <div className="font-medium">{data.subject}</div>
          </div>
          <div className="prose prose-sm">
            <div dangerouslySetInnerHTML={{ __html: formatEmail(data.message) }} />
          </div>
          <div className="border-t pt-2">
            <a href="#" className="text-blue-600 hover:underline">
              {data.trackingLink}
            </a>
          </div>
        </div>
      ) : data.channel === 'sms' ? (
        <div className="bg-blue-500 text-white rounded-lg p-3 max-w-sm">
          <p>{data.message}</p>
          <p className="mt-2 opacity-90">{data.trackingLink}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="border rounded-lg overflow-hidden">
            <Image
              src={data.content.thumbnailUrl}
              alt={data.content.title}
              className="w-full aspect-video object-cover"
            />
            <div className="p-3 bg-muted">
              <div className="font-semibold">{data.content.title}</div>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {data.content.description}
              </div>
              <div className="text-sm text-blue-600 mt-2">
                {data.trackingLink}
              </div>
            </div>
          </div>
          <div className="text-sm">{data.message}</div>
        </div>
      )}
    </CardContent>
  </Card>

  {/* Tracking Info */}
  <Alert>
    <ActivityIcon className="h-4 w-4" />
    <AlertTitle>Tracking Enabled</AlertTitle>
    <AlertDescription>
      You'll be notified when recipients view or engage with this content.
    </AlertDescription>
  </Alert>
</div>
```

**Features**:
- Summary of share details
- Channel-specific preview (email, SMS, social)
- Tracking link display
- Edit buttons to go back
- Final confirmation

---

## 4. Contact Components

### 4.1 ContactList Component

**File**: `src/components/contacts/ContactList.tsx`

**Purpose**: List/table view of contacts

**Props**:
```typescript
interface ContactListProps {
  contacts: Contact[];
  variant?: 'table' | 'grid' | 'list';
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
  onSelect?: (contactIds: string[]) => void;
  selectable?: boolean;
}
```

**Structure (Table Variant)**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      {selectable && (
        <TableHead className="w-12">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
          />
        </TableHead>
      )}
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Phone</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Tags</TableHead>
      <TableHead>Last Contact</TableHead>
      <TableHead className="w-20">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {contacts.map(contact => (
      <TableRow key={contact.id}>
        {selectable && (
          <TableCell>
            <Checkbox
              checked={selected.includes(contact.id)}
              onCheckedChange={() => toggleSelect(contact.id)}
            />
          </TableCell>
        )}
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback>{contact.initials}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{contact.name}</span>
          </div>
        </TableCell>
        <TableCell>{contact.email}</TableCell>
        <TableCell>{contact.phone}</TableCell>
        <TableCell>
          <Badge variant="outline">{contact.relationshipType}</Badge>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {contact.tags.slice(0, 2).map(tag => (
              <Badge key={tag} size="sm">{tag}</Badge>
            ))}
            {contact.tags.length > 2 && (
              <Badge size="sm">+{contact.tags.length - 2}</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          {contact.lastEngagementAt ? (
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(contact.lastEngagementAt)} ago
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Never</span>
          )}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVerticalIcon className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(contact)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => viewTimeline(contact.id)}>
                View Timeline
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(contact.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Structure (Grid Variant - Mobile)**:
```tsx
<div className="grid gap-4">
  {contacts.map(contact => (
    <ContactCard
      key={contact.id}
      contact={contact}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  ))}
</div>
```

---

### 4.2 ContactCard Component

**File**: `src/components/contacts/ContactCard.tsx`

**Purpose**: Contact preview card

**Props**:
```typescript
interface ContactCardProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
  onSelect?: () => void;
}
```

**Structure**:
```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <div className="flex items-center gap-3">
      <Avatar className="w-12 h-12">
        <AvatarFallback>{contact.initials}</AvatarFallback>
      </Avatar>
      <div>
        <CardTitle className="text-lg">{contact.name}</CardTitle>
        <CardDescription>
          <Badge variant="outline" size="sm">{contact.relationshipType}</Badge>
        </CardDescription>
      </div>
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVerticalIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(contact)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(contact.id)}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </CardHeader>
  <CardContent className="space-y-3">
    {/* Contact Info */}
    <div className="space-y-1 text-sm">
      {contact.email && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MailIcon className="w-4 h-4" />
          <span>{contact.email}</span>
        </div>
      )}
      {contact.phone && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <PhoneIcon className="w-4 h-4" />
          <span>{contact.phone}</span>
        </div>
      )}
    </div>

    {/* Tags */}
    {contact.tags.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {contact.tags.map(tag => (
          <Badge key={tag} variant="secondary" size="sm">{tag}</Badge>
        ))}
      </div>
    )}

    {/* Engagement Info */}
    {contact.lastEngagementAt && (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ActivityIcon className="w-3 h-3" />
        <span>Last contact {formatDistanceToNow(contact.lastEngagementAt)} ago</span>
      </div>
    )}

    {/* Quick Actions */}
    <div className="flex gap-2 pt-2">
      <Button variant="outline" size="sm" className="flex-1" onClick={() => call(contact.phone)}>
        <PhoneIcon className="w-3 h-3 mr-1" />
        Call
      </Button>
      <Button variant="outline" size="sm" className="flex-1" onClick={() => email(contact.email)}>
        <MailIcon className="w-3 h-3 mr-1" />
        Email
      </Button>
    </div>
  </CardContent>
</Card>
```

---

### 4.3 ContactForm Component

**File**: `src/components/contacts/ContactForm.tsx`

**Purpose**: Add/edit contact form

**Props**:
```typescript
interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: ContactFormData) => Promise<void>;
  onCancel: () => void;
}
```

**Structure**:
```tsx
<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
  {/* Basic Info */}
  <div className="grid grid-cols-2 gap-4">
    <div>
      <Label htmlFor="firstName">First Name *</Label>
      <Input
        id="firstName"
        {...register('firstName', { required: true })}
        error={errors.firstName?.message}
      />
    </div>
    <div>
      <Label htmlFor="lastName">Last Name *</Label>
      <Input
        id="lastName"
        {...register('lastName', { required: true })}
        error={errors.lastName?.message}
      />
    </div>
  </div>

  {/* Contact Info */}
  <div>
    <Label htmlFor="email">Email</Label>
    <Input
      id="email"
      type="email"
      {...register('email')}
      error={errors.email?.message}
    />
  </div>

  <div>
    <Label htmlFor="phone">Phone</Label>
    <Input
      id="phone"
      type="tel"
      {...register('phone')}
      error={errors.phone?.message}
    />
  </div>

  {/* Relationship Type */}
  <div>
    <Label htmlFor="relationshipType">Relationship Type *</Label>
    <Select {...register('relationshipType', { required: true })}>
      <SelectTrigger>
        <SelectValue placeholder="Select type..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="prospect">Prospect</SelectItem>
        <SelectItem value="customer">Customer</SelectItem>
        <SelectItem value="distributor">Distributor</SelectItem>
        <SelectItem value="other">Other</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Tags */}
  <div>
    <Label htmlFor="tags">Tags</Label>
    <TagInput
      value={tags}
      onChange={setTags}
      placeholder="Add tags..."
    />
  </div>

  {/* Notes */}
  <div>
    <Label htmlFor="notes">Notes</Label>
    <Textarea
      id="notes"
      {...register('notes')}
      rows={4}
      placeholder="Add notes about this contact..."
    />
  </div>

  {/* Consent */}
  <div className="space-y-2">
    <Label>Communication Preferences</Label>
    <div className="flex items-center gap-2">
      <Checkbox id="consentEmail" {...register('consentEmail')} />
      <Label htmlFor="consentEmail" className="font-normal">
        Consent to email communication
      </Label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="consentSms" {...register('consentSms')} />
      <Label htmlFor="consentSms" className="font-normal">
        Consent to SMS communication
      </Label>
    </div>
  </div>

  {/* Actions */}
  <div className="flex gap-2 justify-end pt-4">
    <Button type="button" variant="outline" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : contact ? 'Update Contact' : 'Add Contact'}
    </Button>
  </div>
</form>
```

**Validation**:
- First name and last name required
- Valid email format
- Valid phone format
- At least one contact method (email or phone)
- Relationship type required

---

### 4.4 ContactTimeline Component

**File**: `src/components/contacts/ContactTimeline.tsx`

**Purpose**: Display engagement timeline for a contact

**Props**:
```typescript
interface ContactTimelineProps {
  contactId: string;
  events: EngagementEvent[];
}
```

**Structure**:
```tsx
<div className="space-y-4">
  {events.map((event, index) => (
    <div key={event.id} className="relative">
      {/* Timeline Line */}
      {index < events.length - 1 && (
        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-border" />
      )}

      {/* Event */}
      <div className="flex gap-4">
        {/* Icon */}
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {getEventIcon(event.eventType)}
        </div>

        {/* Content */}
        <div className="flex-1 pb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{getEventTitle(event)}</p>
              <p className="text-sm text-muted-foreground">
                {getEventDescription(event)}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(event.createdAt)} ago
            </span>
          </div>

          {/* Event Metadata */}
          {event.metadata && (
            <Card className="mt-2 bg-muted/50">
              <CardContent className="p-3 text-sm">
                {event.eventType === 'link_clicked' && (
                  <div className="flex items-center gap-2">
                    <ExternalLinkIcon className="w-4 h-4" />
                    <span>Clicked: {event.metadata.contentTitle}</span>
                  </div>
                )}
                {/* ... other event types */}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  ))}

  {/* Empty State */}
  {events.length === 0 && (
    <div className="text-center py-8 text-muted-foreground">
      No engagement history yet
    </div>
  )}
</div>
```

**Event Types**:
- Content shared
- Link clicked
- Page viewed
- Video watched
- Email opened
- SMS delivered
- Follow-up call made
- Meeting scheduled

---

## 5. Engagement Components

### 5.1 EngagementChart Component

**File**: `src/components/engagement/EngagementChart.tsx`

**Purpose**: Visualize engagement metrics

**Props**:
```typescript
interface EngagementChartProps {
  data: EngagementData[];
  type: 'line' | 'bar' | 'pie' | 'area';
  metric: 'shares' | 'clicks' | 'views';
  dateRange: DateRange;
}
```

**Structure (Line Chart Example)**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Engagement Over Time</CardTitle>
    <CardDescription>
      {metric} from {format(dateRange.from, 'MMM d')} to {format(dateRange.to, 'MMM d, yyyy')}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => format(new Date(date), 'MMM d')}
        />
        <YAxis />
        <Tooltip
          content={<CustomTooltip />}
          labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey={metric}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

**Chart Types**:
- **Line Chart**: Trends over time
- **Bar Chart**: Comparisons across categories
- **Pie Chart**: Distribution breakdown
- **Area Chart**: Cumulative values

---

### 5.2 ActivityFeed Component

**File**: `src/components/engagement/ActivityFeed.tsx`

**Purpose**: Real-time feed of engagement events

**Props**:
```typescript
interface ActivityFeedProps {
  events: ActivityEvent[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  filter?: ActivityFilter;
}
```

**Structure**:
```tsx
<div className="space-y-4">
  {/* Filter */}
  <div className="flex items-center gap-2">
    <Select value={filter} onValueChange={setFilter}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Activity</SelectItem>
        <SelectItem value="engagement">Engagement</SelectItem>
        <SelectItem value="content">Content Updates</SelectItem>
        <SelectItem value="nudges">Nudges</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Feed */}
  <div className="space-y-3">
    {events.map(event => (
      <ActivityFeedItem key={event.id} event={event} />
    ))}
  </div>

  {/* Load More */}
  {hasMore && (
    <Button variant="outline" onClick={onLoadMore} className="w-full">
      Load More
    </Button>
  )}
</div>
```

**ActivityFeedItem Sub-Component**:
```tsx
<Card className="hover:bg-muted/50 transition-colors">
  <CardContent className="p-4">
    <div className="flex items-start gap-3">
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
        getEventColorClass(event.type)
      )}>
        {getEventIcon(event.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium">{event.title}</p>
        <p className="text-sm text-muted-foreground">{event.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(event.createdAt)} ago
          </span>
          {event.isUnread && (
            <Badge variant="default" size="sm">New</Badge>
          )}
        </div>
      </div>

      {/* Action */}
      {event.action && (
        <Button variant="outline" size="sm" onClick={event.action.onClick}>
          {event.action.label}
        </Button>
      )}
    </div>
  </CardContent>
</Card>
```

**Event Examples**:
- "John Smith clicked your Product Demo Video"
- "New content published: Spring Sale Campaign"
- "3 contacts need follow-up"
- "You haven't shared content this week"

---

### 5.3 MetricCard Component

**File**: `src/components/engagement/MetricCard.tsx`

**Purpose**: Display single KPI metric

**Props**:
```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType;
  description?: string;
}
```

**Structure**:
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">
      {title}
    </CardTitle>
    {icon && (
      <Icon className="h-4 w-4 text-muted-foreground" />
    )}
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{value}</div>
    {description && (
      <p className="text-xs text-muted-foreground mt-1">
        {description}
      </p>
    )}
    {change !== undefined && (
      <div className={cn(
        "flex items-center text-xs mt-2",
        trend === 'up' && "text-green-600",
        trend === 'down' && "text-red-600",
        trend === 'neutral' && "text-muted-foreground"
      )}>
        {trend === 'up' && <TrendingUpIcon className="w-3 h-3 mr-1" />}
        {trend === 'down' && <TrendingDownIcon className="w-3 h-3 mr-1" />}
        <span>{change > 0 && '+'}{change}% from last period</span>
      </div>
    )}
  </CardContent>
</Card>
```

**Examples**:
- Total Shares: 142 (+12% from last week)
- Click-Through Rate: 23.5% (+3.2%)
- Hot Leads: 8 (unchanged)
- Avg Response Time: 2.4h (-15%)

---

## 6. Admin Components

### 6.1 ContentEditor Component

**File**: `src/components/admin/ContentEditor.tsx`

**Purpose**: Rich content editor for admins

**Props**:
```typescript
interface ContentEditorProps {
  content?: ContentItem;
  onSubmit: (data: ContentFormData) => Promise<void>;
  onCancel: () => void;
}
```

**Structure**:
```tsx
<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
  {/* Basic Info */}
  <Card>
    <CardHeader>
      <CardTitle>Basic Information</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...register('title', { required: true })}
          placeholder="Content title"
        />
      </div>

      <div>
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input
          id="subtitle"
          {...register('subtitle')}
          placeholder="Optional subtitle"
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register('description', { required: true })}
          rows={4}
          placeholder="Describe this content"
        />
      </div>

      <div>
        <Label htmlFor="contentType">Content Type *</Label>
        <Select {...register('contentType', { required: true })}>
          <SelectTrigger>
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="pdf">PDF/Document</SelectItem>
            <SelectItem value="landing_page">Landing Page</SelectItem>
            <SelectItem value="article">Article</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>

  {/* Media */}
  <Card>
    <CardHeader>
      <CardTitle>Media</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label>Thumbnail</Label>
        <FileUploader
          accept="image/*"
          onUpload={(file) => setValue('thumbnailFile', file)}
          preview={watch('thumbnailUrl')}
        />
      </div>

      <div>
        <Label>Media URL or Upload</Label>
        <div className="space-y-2">
          <Input
            {...register('mediaUrl')}
            placeholder="https://... or upload below"
          />
          <FileUploader
            accept="video/*,image/*,application/pdf"
            onUpload={(file) => setValue('mediaFile', file)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="destinationUrl">Destination URL (Landing Page)</Label>
        <Input
          id="destinationUrl"
          {...register('destinationUrl')}
          placeholder="https://..."
        />
      </div>
    </CardContent>
  </Card>

  {/* Targeting */}
  <Card>
    <CardHeader>
      <CardTitle>Targeting</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label>Markets *</Label>
        <MultiSelect
          options={markets}
          value={watch('markets')}
          onChange={(value) => setValue('markets', value)}
          placeholder="Select markets..."
        />
      </div>

      <div>
        <Label>Languages *</Label>
        <MultiSelect
          options={languages}
          value={watch('languages')}
          onChange={(value) => setValue('languages', value)}
          placeholder="Select languages..."
        />
      </div>

      <div>
        <Label htmlFor="category">Category *</Label>
        <Select {...register('category', { required: true })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category..." />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Tags</Label>
        <TagInput
          value={watch('tags')}
          onChange={(value) => setValue('tags', value)}
          placeholder="Add tags..."
        />
      </div>
    </CardContent>
  </Card>

  {/* Share Settings */}
  <Card>
    <CardHeader>
      <CardTitle>Share Settings</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label>Available Channels</Label>
        <div className="space-y-2 mt-2">
          {channels.map(channel => (
            <div key={channel} className="flex items-center gap-2">
              <Checkbox
                checked={watch('channels').includes(channel)}
                onCheckedChange={() => toggleChannel(channel)}
              />
              <Label className="font-normal capitalize">{channel}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>SMS Share Template</Label>
        <Textarea
          {...register('smsTemplate')}
          rows={3}
          placeholder="Approved SMS copy..."
        />
      </div>

      <div>
        <Label>Email Share Template</Label>
        <RichTextEditor
          value={watch('emailTemplate')}
          onChange={(value) => setValue('emailTemplate', value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          {...register('allowPersonalNote')}
        />
        <Label className="font-normal">Allow UFO to add personal note</Label>
      </div>

      <div>
        <Label htmlFor="ctaType">Call-to-Action Type</Label>
        <Select {...register('ctaType')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="learn_more">Learn More</SelectItem>
            <SelectItem value="shop_now">Shop Now</SelectItem>
            <SelectItem value="contact_me">Contact Me</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {watch('ctaType') === 'custom' && (
        <div>
          <Label htmlFor="ctaLabel">CTA Label</Label>
          <Input
            id="ctaLabel"
            {...register('ctaLabel')}
            placeholder="Custom CTA text"
          />
        </div>
      )}
    </CardContent>
  </Card>

  {/* Compliance */}
  <Card>
    <CardHeader>
      <CardTitle>Compliance</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label>Compliance Flags</Label>
        <MultiSelect
          options={complianceFlags}
          value={watch('complianceFlags')}
          onChange={(value) => setValue('complianceFlags', value)}
          placeholder="Select flags..."
        />
      </div>

      <div>
        <Label htmlFor="disclaimer">Required Disclaimer</Label>
        <Textarea
          id="disclaimer"
          {...register('disclaimer')}
          rows={2}
          placeholder="Legal disclaimer if required..."
        />
      </div>

      <div>
        <Label htmlFor="expiresAt">Expiration Date</Label>
        <Input
          id="expiresAt"
          type="datetime-local"
          {...register('expiresAt')}
        />
      </div>
    </CardContent>
  </Card>

  {/* Campaign */}
  <Card>
    <CardHeader>
      <CardTitle>Campaign (Optional)</CardTitle>
    </CardHeader>
    <CardContent>
      <Select {...register('campaignId')}>
        <SelectTrigger>
          <SelectValue placeholder="No campaign" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">No campaign</SelectItem>
          {campaigns.map(campaign => (
            <SelectItem key={campaign.id} value={campaign.id}>
              {campaign.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CardContent>
  </Card>

  {/* Publishing */}
  <Card>
    <CardHeader>
      <CardTitle>Publishing</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label htmlFor="status">Status</Label>
        <Select {...register('status')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="review">In Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="publishedAt">Publish Date/Time</Label>
        <Input
          id="publishedAt"
          type="datetime-local"
          {...register('publishedAt')}
        />
      </div>
    </CardContent>
  </Card>

  {/* Actions */}
  <div className="flex gap-2 justify-end pt-4 sticky bottom-0 bg-background border-t p-4 -mx-4">
    <Button type="button" variant="outline" onClick={handlePreview}>
      Preview
    </Button>
    <Button type="button" variant="outline" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : content ? 'Update Content' : 'Create Content'}
    </Button>
  </div>
</form>
```

**Features**:
- Rich text editor for templates
- File upload for media
- Multi-select for targeting
- Compliance controls
- Campaign assignment
- Publish scheduling
- Preview functionality

---

## 7. Form Components

### 7.1 FileUploader Component

**File**: `src/components/shared/FileUploader.tsx`

**Purpose**: Drag-and-drop file upload

**Props**:
```typescript
interface FileUploaderProps {
  accept?: string;
  maxSize?: number;
  onUpload: (file: File) => void;
  preview?: string;
  multiple?: boolean;
}
```

**Structure**:
```tsx
<div className="space-y-4">
  {/* Dropzone */}
  <div
    {...getRootProps()}
    className={cn(
      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
      isDragActive && "border-primary bg-primary/5",
      !isDragActive && "border-muted-foreground/25 hover:border-muted-foreground/50"
    )}
  >
    <input {...getInputProps()} />
    <UploadIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
    {isDragActive ? (
      <p className="text-sm">Drop files here...</p>
    ) : (
      <div>
        <p className="text-sm font-medium">Drag & drop files here, or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">
          {accept ? `Accepted formats: ${accept}` : 'All file types accepted'}
        </p>
        {maxSize && (
          <p className="text-xs text-muted-foreground">
            Max size: {formatBytes(maxSize)}
          </p>
        )}
      </div>
    )}
  </div>

  {/* Preview */}
  {preview && (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
      <Image src={preview} alt="Preview" fill className="object-cover" />
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2"
        onClick={handleRemove}
      >
        <XIcon className="w-4 h-4" />
      </Button>
    </div>
  )}

  {/* Upload Progress */}
  {isUploading && (
    <div className="space-y-2">
      <Progress value={uploadProgress} />
      <p className="text-sm text-muted-foreground text-center">
        Uploading... {uploadProgress}%
      </p>
    </div>
  )}

  {/* Error */}
  {error && (
    <Alert variant="destructive">
      <AlertCircleIcon className="h-4 w-4" />
      <AlertTitle>Upload Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )}
</div>
```

**Features**:
- Drag-and-drop
- Click to browse
- File type validation
- File size validation
- Upload progress
- Preview (images)
- Error handling

---

### 7.2 TagInput Component

**File**: `src/components/shared/TagInput.tsx`

**Purpose**: Add/remove tags with autocomplete

**Props**:
```typescript
interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
}
```

**Structure**:
```tsx
<div className="space-y-2">
  {/* Tags */}
  {value.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {value.map(tag => (
        <Badge key={tag} variant="secondary">
          {tag}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 hover:bg-transparent"
            onClick={() => removeTag(tag)}
          >
            <XIcon className="w-3 h-3" />
          </Button>
        </Badge>
      ))}
    </div>
  )}

  {/* Input */}
  <div className="relative">
    <Input
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={maxTags && value.length >= maxTags}
    />

    {/* Suggestions */}
    {showSuggestions && filteredSuggestions.length > 0 && (
      <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-10">
        {filteredSuggestions.map(suggestion => (
          <button
            key={suggestion}
            className="w-full text-left px-3 py-2 hover:bg-muted"
            onClick={() => addTag(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    )}
  </div>

  {maxTags && (
    <p className="text-xs text-muted-foreground">
      {value.length} / {maxTags} tags
    </p>
  )}
</div>
```

**Features**:
- Add tags by typing and pressing Enter
- Remove tags by clicking X
- Autocomplete suggestions
- Max tags limit
- Keyboard navigation

---

## 8. Shared Components

### 8.1 EmptyState Component

**File**: `src/components/shared/EmptyState.tsx`

**Purpose**: Display when no data is available

**Props**:
```typescript
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Structure**:
```tsx
<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
  {icon && (
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-muted-foreground" />
    </div>
  )}
  <h3 className="text-lg font-semibold mb-2">{title}</h3>
  {description && (
    <p className="text-sm text-muted-foreground max-w-md mb-6">
      {description}
    </p>
  )}
  {action && (
    <Button onClick={action.onClick}>
      {action.label}
    </Button>
  )}
</div>
```

**Examples**:
- No content available: "No content found. Try adjusting your filters."
- No contacts: "You haven't added any contacts yet. Get started by adding your first contact."
- No shares: "You haven't shared any content yet. Browse the content library to get started."

---

### 8.2 ConfirmDialog Component

**File**: `src/components/shared/ConfirmDialog.tsx`

**Purpose**: Confirmation modal for destructive actions

**Props**:
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'default' | 'destructive';
}
```

**Structure**:
```tsx
<AlertDialog open={isOpen} onOpenChange={onClose}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{title}</AlertDialogTitle>
      <AlertDialogDescription>{description}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={onConfirm}
        className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : ''}
      >
        {confirmLabel || 'Confirm'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Usage**:
```tsx
<ConfirmDialog
  isOpen={showDeleteConfirm}
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Contact?"
  description="This action cannot be undone. The contact and all associated data will be permanently deleted."
  confirmLabel="Delete"
  variant="destructive"
/>
```

---

## Summary

This component specification document provides detailed implementation guidance for all major components in the UnFranchise Marketing App. Each component is designed to be:

- **Reusable**: Can be used across multiple pages
- **Accessible**: WCAG 2.1 AA compliant
- **Responsive**: Mobile-first design
- **Type-safe**: TypeScript interfaces for all props
- **Testable**: Clear structure for unit/integration tests
- **Maintainable**: Consistent patterns and naming

The components are built using shadcn/ui as the base, with custom logic and styling to match the UnFranchise Marketing App requirements.

**Next Steps**:
1. Implement base UI components (shadcn/ui)
2. Build layout components (Header, Sidebar, MobileNav)
3. Develop feature-specific components (Content, Share, Contact, Engagement)
4. Create admin components
5. Build shared utilities and form components
6. Write unit tests for all components
7. Document component usage in Storybook

---

**Document Version**: 1.0
**Last Updated**: 2026-04-04
**Author**: Lead Frontend Developer
