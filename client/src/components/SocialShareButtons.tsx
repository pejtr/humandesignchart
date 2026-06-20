import React, { useState } from 'react';
import { Share2, Facebook, MessageCircle, Twitter, Copy, Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SocialShareButtonsProps {
    url: string;
    title: string;
}

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ url, title }) => {
    const [copied, setCopied] = useState(false);

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const shareLinks = [
        {
            name: 'Facebook',
            icon: Facebook,
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: 'hover:bg-blue-600 hover:text-white',
        },
        {
            name: 'WhatsApp',
            icon: MessageCircle,
            url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            color: 'hover:bg-green-500 hover:text-white',
        },
        {
            name: 'X',
            icon: Twitter,
            url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
            color: 'hover:bg-black hover:text-white',
        },
        {
            name: 'Telegram',
            icon: Send,
            url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
            color: 'hover:bg-sky-500 hover:text-white',
        },
    ];

    const handleCopyLink = () => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            toast.success("Odkaz zkopírován do schránky");
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="flex flex-wrap gap-2">
            {shareLinks.map((link) => (
                <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Sdílet na ${link.name}`}
                >
                    <Button variant="outline" size="icon" className={`w-9 h-9 rounded-full transition-colors ${link.color}`}>
                        <link.icon className="w-4 h-4" />
                    </Button>
                </a>
            ))}
            <Button
                variant="outline"
                size="icon"
                className="w-9 h-9 rounded-full hover:bg-primary hover:text-white transition-colors"
                onClick={handleCopyLink}
                title="Kopírovat odkaz"
            >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
        </div>
    );
};
