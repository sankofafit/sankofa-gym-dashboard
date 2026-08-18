/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { StatusIcons, ActionIcons, ImageIcon } from './Icons';

export default function ClassImageUploader({
  classId,
  gymId,
  userId,
  existingImages = [],
  onImagesUpdate,
}) {
  const [images, setImages] = useState(
    Array.isArray(existingImages) ? existingImages : []
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!classId) {
    return (
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'rgba(245,200,66,0.06)',
        border: '1px solid rgba(245,200,66,0.2)',
        borderRadius: 10,
        color: '#F5C842',
        fontSize: 12,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <StatusIcons.Warning size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        Save the class first before uploading photos.
      </div>
    );
  }

  const uploadImage = async (file) => {
    try {
      if (images.length >= 3) {
        setError('Maximum 3 images per class');
        return;
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPG, PNG)');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }

      setUploading(true);
      setError('');

      const fileExt = file.name.split('.').pop().toLowerCase();
      const timestamp = Date.now();
      const fileName = `${userId}/${gymId}/classes/${classId}_${timestamp}.${fileExt}`;

      console.log('Uploading class image:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gym-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.log('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      console.log('Upload successful:', uploadData);

      const { data: urlData } = supabase.storage
        .from('gym-images')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('Public URL:', publicUrl);

      const newImages = [...images, publicUrl];

      const { error: updateError } = await supabase
        .from('gym_classes')
        .update({
          images: newImages,
          image_url: newImages[0],
        })
        .eq('id', classId);

      if (updateError) {
        console.log('Update error:', updateError);
        throw new Error(updateError.message);
      }

      setImages(newImages);
      onImagesUpdate && onImagesUpdate(newImages);
      console.log('Class images updated successfully');

    } catch (e) {
      console.log('ClassImageUploader error:', e);
      setError(e.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url, index) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      const newImages = images.filter((_, i) => i !== index);

      const { error: updateError } = await supabase
        .from('gym_classes')
        .update({
          images: newImages,
          image_url: newImages[0] || null,
        })
        .eq('id', classId);

      if (updateError) throw new Error(updateError.message);

      setImages(newImages);
      onImagesUpdate && onImagesUpdate(newImages);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      {error && (
        <div style={{
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8,
          padding: '8px 12px',
          color: '#EF4444',
          fontSize: 12,
          marginBottom: 10,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}>
          <StatusIcons.Error size={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 10,
        alignItems: 'flex-start',
      }}>
        {images.map((url, i) => (
          <div key={`img-${i}`} style={{
            position: 'relative',
            width: 110,
            height: 90,
            borderRadius: 10,
            overflow: 'hidden',
            border: i === 0
              ? '2px solid rgba(245,200,66,0.6)'
              : '1px solid rgba(255,255,255,0.1)',
          }}>
            <img
              src={url}
              alt={`Class visual ${i + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={e => {
                e.target.src = 'https://via.placeholder.com/110x90?text=Error';
              }}
            />
            <button
              type="button"
              onClick={() => handleDelete(url, i)}
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                backgroundColor: 'rgba(239,68,68,0.9)',
                border: 'none',
                borderRadius: 5,
                width: 22,
                height: 22,
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              <ActionIcons.Close size={14} />
            </button>
            {i === 0 && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(245,200,66,0.92)',
                color: '#1B2F6B',
                fontSize: 9,
                fontWeight: 900,
                textAlign: 'center',
                padding: '3px 0',
                letterSpacing: 0.5,
              }}>
                MAIN PHOTO
              </div>
            )}
          </div>
        ))}

        {images.length < 3 && (
          <div
            onClick={() => {
              if (!uploading) fileInputRef.current?.click();
            }}
            style={{
              width: 110,
              height: 90,
              borderRadius: 10,
              border: '2px dashed rgba(245,200,66,0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              gap: 4,
              backgroundColor: 'rgba(245,200,66,0.03)',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => {
              if (!uploading) {
                e.currentTarget.style.borderColor = 'rgba(245,200,66,0.7)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(245,200,66,0.35)';
            }}
          >
            {uploading ? (
              <div style={{
                textAlign: 'center',
                padding: 8,
              }}>
                <div style={{
                  width: 20, height: 20,
                  border: '2px solid rgba(245,200,66,0.2)',
                  borderTop: '2px solid #F5C842',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 6px',
                }} />
                <span style={{
                  color: '#F5C842',
                  fontSize: 10,
                }}>
                  Uploading...
                </span>
              </div>
            ) : (
              <>
                <span style={{
                  fontSize: 22,
                  color: 'rgba(245,200,66,0.6)',
                }}>
                  +
                </span>
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: 10,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}>
                  Add Photo
                </span>
                <span style={{
                  color: 'rgba(107,123,153,0.6)',
                  fontSize: 9,
                }}>
                  ({images.length}/3)
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await uploadImage(file);
          e.target.value = '';
        }}
        style={{ display: 'none' }}
      />

      <div style={{
        color: 'var(--text-secondary)',
        fontSize: 11,
        lineHeight: 1.5,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        flexWrap: 'wrap',
      }}>
        <ImageIcon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Upload up to 3 photos · JPG or PNG · Max 5MB each
          {images.length === 0 && (
            <span style={{ color: '#F5C842' }}>
              {' '}· First photo becomes the class thumbnail
            </span>
          )}
        </span>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
