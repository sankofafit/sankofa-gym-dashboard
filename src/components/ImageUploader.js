import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  UploadIcon,
  ImageIcon,
  StatusIcons,
  ActionIcons,
} from './Icons';

export default function ImageUploader({
  gymId,
  userId,
  existingImages = [],
  coverImage = '',
  onImagesUpdate,
  onCoverUpdate,
}) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState(existingImages);
  const [cover, setCover] = useState(coverImage);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    setImages(existingImages || []);
  }, [existingImages]);

  useEffect(() => {
    setCover(coverImage || '');
  }, [coverImage]);

  const uploadImage = async (file, isCover = false) => {
    if (!gymId || !userId) {
      setError('Save your gym profile first before uploading photos.');
      return;
    }

    try {
      setUploading(true);
      setError('');

      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${gymId}/${isCover ? 'cover' : Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('gym-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: isCover,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('gym-images').getPublicUrl(fileName);

      if (isCover) {
        const { error: updateError } = await supabase
          .from('gyms')
          .update({ cover_image_url: publicUrl })
          .eq('id', gymId);

        if (updateError) throw updateError;

        setCover(publicUrl);
        onCoverUpdate?.(publicUrl);
      } else {
        const { data: row } = await supabase
          .from('gyms')
          .select('images')
          .eq('id', gymId)
          .single();

        const current = Array.isArray(row?.images) ? row.images : images;
        const newImages = [...current, publicUrl];
        const { error: updateError } = await supabase
          .from('gyms')
          .update({ images: newImages })
          .eq('id', gymId);

        if (updateError) throw updateError;

        setImages(newImages);
        onImagesUpdate?.(newImages);
      }
    } catch (e) {
      setError(e.message);
      console.log('Upload error:', e);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e, isCover = false) => {
    const file = e.target.files[0];
    if (file) await uploadImage(file, isCover);
    e.target.value = '';
  };

  const handleDeleteImage = async (index) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      const newImages = images.filter((_, i) => i !== index);
      const { error: updateError } = await supabase
        .from('gyms')
        .update({ images: newImages })
        .eq('id', gymId);

      if (updateError) throw updateError;

      setImages(newImages);
      onImagesUpdate?.(newImages);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#EF4444',
            fontSize: 13,
            marginBottom: 16,
          display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <StatusIcons.Error size={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            color: '#6B7B99',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Cover Image (shown as main gym photo)
        </div>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') coverInputRef.current?.click();
          }}
          onClick={() => coverInputRef.current?.click()}
          style={{
            width: '100%',
            height: 200,
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '2px dashed rgba(245,200,66,0.3)',
            marginBottom: 12,
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          {cover ? (
            <>
              <img
                src={cover}
                alt="Cover"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = 1;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = 0;
                }}
              >
                <span
                  style={{
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '8px 16px',
                    borderRadius: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <UploadIcon size={16} />
                  Change Cover Photo
                </span>
              </div>
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 8,
              }}
            >
              <ImageIcon size={40} color="rgba(245,200,66,0.5)" />
              <span style={{ color: '#6B7B99', fontSize: 14 }}>Click to upload cover photo</span>
              <span style={{ color: '#6B7B99', fontSize: 12 }}>JPG, PNG up to 5MB</span>
            </div>
          )}
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, true)}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploading}
          style={{
            backgroundColor: 'rgba(245,200,66,0.1)',
            border: '1px solid rgba(245,200,66,0.3)',
            borderRadius: 10,
            padding: '10px 20px',
            color: '#F5C842',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            opacity: uploading ? 0.6 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {uploading ? (
            <>
              <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
                <ActionIcons.Refresh size={16} />
              </span>
              Uploading...
            </>
          ) : (
            <>
              <UploadIcon size={16} />
              Upload Cover Photo
            </>
          )}
        </button>
      </div>

      <div>
        <div
          style={{
            color: '#6B7B99',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Gallery Photos ({images.length}/10)
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 10,
            marginBottom: 14,
          }}
        >
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              style={{
                position: 'relative',
                borderRadius: 10,
                overflow: 'hidden',
                height: 120,
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <img
                src={url}
                alt={`Gym ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <button
                type="button"
                onClick={() => handleDeleteImage(index)}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  backgroundColor: 'rgba(239,68,68,0.9)',
                  border: 'none',
                  borderRadius: 6,
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <ActionIcons.Close size={14} />
              </button>
            </div>
          ))}

          {images.length < 10 && (
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                height: 120,
                borderRadius: 10,
                border: '2px dashed rgba(245,200,66,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                gap: 6,
                backgroundColor: 'rgba(245,200,66,0.03)',
              }}
            >
              <span style={{ fontSize: 24 }}>+</span>
              <span style={{ color: '#6B7B99', fontSize: 11, textAlign: 'center' }}>Add Photo</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            for (const file of files) {
              if (images.length >= 10) break;
              await uploadImage(file, false);
            }
            e.target.value = '';
          }}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= 10}
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '10px 20px',
            color: '#6B7B99',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: uploading || images.length >= 10 ? 0.5 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {uploading ? (
            <>
              <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
                <ActionIcons.Refresh size={16} />
              </span>
              Uploading...
            </>
          ) : images.length >= 10 ? (
            'Maximum 10 photos reached'
          ) : (
            <>
              <UploadIcon size={16} />
              Add Gallery Photos
            </>
          )}
        </button>

        <div style={{ color: '#6B7B99', fontSize: 11, marginTop: 8 }}>
          These photos appear in your gym profile on the Sankofa Fit app. Add photos of your
          equipment, classes and facilities.
        </div>
      </div>
    </div>
  );
}
