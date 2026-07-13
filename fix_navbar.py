import sys

with open('client/src/components/Navbar.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# I will find "          {/* Col 2: Centered Section (Logo + Links) */}"
# and I will replace everything until "          {/* Col 3: Right Controls (Desktop + Mobile) */}"

import re

# Find the start of Col 2
start_idx = text.find("          {/* Col 2: Centered Section (Logo + Links) */}")
if start_idx == -1:
    print("Could not find Col 2 start.")
    sys.exit(1)

# Find the start of desktop right section
end_idx = text.find("            {/* Desktop right section: theme toggle + language + user */}")

if end_idx == -1:
    print("Could not find Desktop right section.")
    sys.exit(1)

prefix = text[:start_idx]
suffix = text[end_idx:]

new_center = """          {/* Center: Logo + Desktop nav links */}
          <div className="flex flex-shrink-0 items-center justify-center gap-6">
            {/* Logo */}
            <Link href={localePath("/")} className="flex items-center gap-2.5 no-underline shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="4" r="2" />
                  <circle cx="12" cy="12" r="2.5" />
                  <circle cx="12" cy="20" r="2" />
                  <circle cx="6" cy="8" r="1.5" />
                  <circle cx="18" cy="8" r="1.5" />
                  <line x1="12" y1="6" x2="12" y2="9.5" />
                  <line x1="12" y1="14.5" x2="12" y2="18" />
                  <line x1="7.2" y1="7" x2="10" y2="10.5" />
                  <line x1="16.8" y1="7" x2="14" y2="10.5" />
                </svg>
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-foreground hidden md:block">
                Human Design
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-0.5">
              {primaryLinks.map(link => (
                <Link key={link.href} href={localePath(link.href)}>
                  <Button
                    variant={isActive(link.href) ? "secondary" : "ghost"}
                    size="sm"
                    className="text-sm"
                  >
                    <link.icon className="w-4 h-4 mr-1.5" />
                    {link.label}
                  </Button>
                </Link>
              ))}

              {/* Tools dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm gap-1">
                    <Flame className="w-4 h-4" />
                    {locale === "cs" ? "Nástroje" : "Tools"}
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64 bg-popover text-popover-foreground">
                  {toolsLinks.map(link => (
                    <Link key={link.href} href={localePath(link.href)}>
                      <DropdownMenuItem className="cursor-pointer py-2.5">
                        <link.icon className="w-4 h-4 mr-2.5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{link.label}</p>
                          <p className="text-xs text-muted-foreground">{link.desc}</p>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Explore dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm gap-1">
                    <Sparkles className="w-4 h-4" />
                    {locale === "cs" ? "Prozkoumat" : "Explore"}
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64 bg-popover text-popover-foreground">
                  {exploreLinks.map(link => (
                    <Link key={link.href} href={localePath(link.href)}>
                      <DropdownMenuItem className="cursor-pointer py-2.5">
                        <link.icon className="w-4 h-4 mr-2.5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{link.label}</p>
                          <p className="text-xs text-muted-foreground">{link.desc}</p>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Pricing link */}
              <Link href={localePath("/pricing")}>
                <Button
                  variant={isActive("/pricing") ? "secondary" : "ghost"}
                  size="sm"
                  className="text-sm"
                >
                  <Crown className="w-4 h-4 mr-1.5" />
                  {locale === "cs" ? "Premium" : "Premium"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Controls (Desktop + Mobile) */}
          <div className="flex-1 flex items-center justify-end gap-1.5 shrink-0">
"""

result = prefix + new_center + suffix
with open('client/src/components/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(result)
print("Done fixing Navbar!")
