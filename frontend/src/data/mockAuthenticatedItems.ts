import { AuthenticatedItem } from '../types';

export const mockItems: AuthenticatedItem[] = [
    {
        id: '1',
        name: 'Limited Edition Sports Card',
        description: 'Rare rookie card from the 2020 series',
        category: 'Sports Memorabilia',
        year: '2020',
        condition: 'Mint',
        thumbnail:
            'https://images.unsplash.com/photo-1590502160462-58b41354f588?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fExpbWl0ZWQlMjBFZGl0aW9uJTIwU3BvcnRzJTIwQ2FyZHxlbnwwfHwwfHx8MA%3D%3D',
        tokenId: '0x1234',
        ipfsHash: 'QmZ9wfe...',
        blockchainTxHash: '0x7a9e...',
        nftTokenId: '123',
        mintingDate: '2022-01-15',
        isVerified: true,
        isAuthentic: true,
        confidence: 0.95,
        details: 'Authenticated through blockchain verification',
        verificationId: 'ver_123456',
    },
    {
        id: '102',
        name: 'Action Comics #1000',
        description: 'Jim Lee Cover Variant, 1st printing, special anniversary edition',
        category: 'Comics',
        year: '2018',
        condition: 'Near Mint',
        thumbnail:
            'https://images.unsplash.com/photo-1628426912481-b66c067fdf7a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        tokenId: '5935',
        ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
        blockchainTxHash: '0x7b4ab9e5e3f2267a1d2db66a66a452ae9ac6cabfc8d8728783d4a5c91234567',
        nftTokenId: '12346',
        mintingDate: '2023-09-21',
        isVerified: true,
        isAuthentic: true,
        confidence: 0.98,
        details: 'Verified with original publisher data',
        verificationId: 'ver_789012',
    },
];
