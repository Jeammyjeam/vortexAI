
// Using a server component to fetch data initially for SEO and faster loads
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/server'; // We need a server-side admin instance
import { Product } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ExternalLink, XCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import placeholderImages from '@/lib/placeholder-images.json';
import { ProductStatusUpdater } from './product-status-updater';


async function getProduct(id: string): Promise<Product | null> {
    try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }
        
        const data = docSnap.data();
        
        // Firestore Timestamps need to be converted for serialization
        const productData: Product = {
            id: docSnap.id,
            ...data,
            created_at: data.created_at?.toDate() || new Date(),
            updated_at: data.updated_at?.toDate() || new Date(),
            enriched_at: data.enriched_at ? data.enriched_at.toDate() : undefined,
            published_at: data.published_at ? data.published_at.toDate() : undefined,
        } as Product;
        
        return productData;

    } catch (error) {
        console.error("Error fetching product:", error);
        return null; // Don't throw, just return null to be handled as a 404
    }
}


export default async function ProductDetailPage({ params }: { params: { id: string } }) {
    const product = await getProduct(params.id);

    if (!product) {
        notFound();
    }

    const placeholder = placeholderImages[0];
    const displayImage = product.images?.[0]?.replace('gs://', 'https://storage.googleapis.com/') || placeholder.url;

    const getStatusVariant = (status: Product['listing_status']) => {
        switch (status) {
            case 'published': return 'default';
            case 'approved': return 'secondary';
            case 'enriched': return 'secondary';
            case 'rejected':
            case 'failed_enrichment':
            case 'failed_publish':
            return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="container mx-auto py-12 px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image Column */}
                    <div>
                         <Card className="overflow-hidden glassmorphic">
                             <div className="aspect-square relative">
                                <Image
                                    src={displayImage}
                                    alt={product.title}
                                    fill
                                    className="object-cover"
                                />
                             </div>
                         </Card>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                             {(product.images || []).slice(1, 5).map((img, index) => (
                                 <div key={index} className="aspect-square relative rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors">
                                     <Image
                                         src={img.replace('gs://', 'https://storage.googleapis.com/')}
                                         alt={`${product.title} view ${index + 2}`}
                                         fill
                                         className="object-cover"
                                     />
                                 </div>
                             ))}
                         </div>
                    </div>
                    {/* Details Column */}
                    <div>
                        <Badge variant={getStatusVariant(product.listing_status)} className="capitalize mb-2">{product.listing_status.replace(/_/g, ' ')}</Badge>
                        <h1 className="text-3xl lg:text-4xl font-bold font-orbitron">{product.enriched_fields?.seo_title || product.title}</h1>
                        <a href={product.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 mt-1">
                            {product.source_domain} <ExternalLink className="h-3 w-3"/>
                        </a>

                        <div className="flex items-center gap-4 mt-4 text-xl">
                            <div className="flex items-center gap-1.5 text-primary">
                                <DollarSign className="h-6 w-6" />
                                <span className="font-bold font-satoshi">{product.price?.toFixed(2)} {product.currency}</span>
                            </div>
                        </div>

                        <p className="mt-6 text-base text-foreground/80 font-inter leading-relaxed">
                            {product.enriched_fields?.seo_description || product.description}
                        </p>
                        
                        {product.halal_status && product.halal_status === 'compliant' && (
                             <Card className="mt-6 bg-green-600/10 border-green-500/30">
                                <CardHeader>
                                    <CardTitle className="text-green-400 flex items-center gap-2"><CheckCircle className="h-5 w-5"/> Halal Compliant</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-green-400/80">
                                        {product.halal_reasoning}
                                    </p>
                                </CardContent>
                             </Card>
                        )}

                        {product.halal_status && product.halal_status !== 'compliant' && (
                             <Card className="mt-6 bg-destructive/10 border-destructive/30">
                                <CardHeader>
                                    <CardTitle className="text-destructive flex items-center gap-2"><XCircle className="h-5 w-5"/> Compliance Issue</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-destructive-foreground/80">
                                        <strong className="capitalize">{product.halal_status}:</strong> {product.halal_reasoning || product.rejection_reason}
                                    </p>
                                </CardContent>
                             </Card>
                        )}

                        {product.listing_status.startsWith('failed') && product.error_message && (
                            <Card className="mt-6 bg-amber-500/10 border-amber-500/30">
                                <CardHeader>
                                    <CardTitle className="text-amber-400 flex items-center gap-2"><XCircle className="h-5 w-5"/> System Error</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-amber-400/80 font-mono break-all">
                                        {product.error_message}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                        
                         {/* Admin Action Bar */}
                        <div className="mt-8 pt-6 border-t border-border">
                            <h3 className="font-satoshi font-semibold mb-3">Admin Actions</h3>
                            <ProductStatusUpdater productId={product.id} currentStatus={product.listing_status} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

    